"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";

// ─── Fetcher for plans ─────────────────────────────────────────────────────────
type Plan = { id: string; name: string; priceMonthly: number; maxStudents: number };

// ─── Schemas ───────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, "School name is required"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  principalName: z.string().optional(),
});

const step2Schema = z.object({
  domain: z.string().optional(),
});

const step3Schema = z.object({
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  planId: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

// ─── Slugify helper ────────────────────────────────────────────────────────────
function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Token generator ───────────────────────────────────────────────────────────
function generateToken() {
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `schoolms-verify=${hex}`;
}

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ["School Details", "Domain Verification", "Admin Account"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <Progress value={((current - 1) / (STEPS.length - 1)) * 100} className="mb-4 h-1.5" />
      <div className="flex justify-between">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────
export default function NewSchoolPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [verifyToken] = useState(generateToken);
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "verified" | "failed">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  // Accumulated form data across steps
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values>({ domain: "" });

  // Plans fetch
  const { data: plans = [] } = useSWR<Plan[]>("/api/superadmin/plans", (url: string) =>
    fetch(url).then((r) => r.json())
  );

  // ── Step 1 form
  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", slug: "", address: "", phone: "", email: "", principalName: "" },
  });

  // ── Step 2 form
  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { domain: "" },
  });

  // ── Step 3 form
  const form3 = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: { adminName: "", adminEmail: "", adminPassword: "", planId: "" },
  });

  // ── Handlers
  const onStep1Next = (values: Step1Values) => {
    setStep1Data(values);
    setStep(2);
  };

  const handleVerify = async () => {
    const domain = form2.getValues("domain");
    if (!domain) return;
    setVerifyState("checking");
    const res = await fetch("/api/superadmin/verify-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, token: verifyToken }),
    });
    const data = await res.json();
    setVerifyState(data.verified ? "verified" : "failed");
  };

  const onStep2Next = (values: Step2Values) => {
    setStep2Data(values);
    setStep(3);
  };

  const onStep3Submit = async (values: Step3Values) => {
    if (!step1Data) return;
    setServerError(null);

    const res = await fetch("/api/superadmin/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school: {
          ...step1Data,
          domain: step2Data.domain || undefined,
          verifyToken,
          isVerified: verifyState === "verified",
          planId: values.planId || undefined,
        },
        admin: {
          name: values.adminName,
          email: values.adminEmail,
          password: values.adminPassword,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error ?? "Provisioning failed");
      return;
    }
    router.push(`/superadmin/schools/${data.schoolId}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Onboard New School</h1>
        <p className="text-sm text-muted-foreground">
          Complete the wizard to create a school and provision its database.
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: School Details ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>School Details</CardTitle>
            <CardDescription>Basic information about the school</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form1}>
              <form onSubmit={form1.handleSubmit(onStep1Next)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form1.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>School Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sunrise International School"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (!form1.formState.dirtyFields.slug) {
                                form1.setValue("slug", slugify(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border border-input">
                            <span className="px-3 text-sm text-muted-foreground">school_</span>
                            <Input
                              className="border-0 pl-0 focus-visible:ring-0"
                              placeholder="sunrise-intl"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Used as the database name: school_{"{slug}"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="principalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal Name</FormLabel>
                        <FormControl><Input placeholder="Dr. Rajan Sharma" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Email</FormLabel>
                        <FormControl><Input type="email" placeholder="info@school.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form1.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 School Road, City, State" rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Continue →</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Domain Verification ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Verification</CardTitle>
            <CardDescription>
              Verify the school&apos;s domain by adding a DNS TXT record. You can skip this if the school
              has no custom domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Form {...form2}>
              <form onSubmit={form2.handleSubmit(onStep2Next)} className="space-y-5">
                <FormField
                  control={form2.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input placeholder="school.example.com" {...field} />
                      </FormControl>
                      <FormDescription>Enter the school&apos;s domain (without https://)</FormDescription>
                    </FormItem>
                  )}
                />

                {form2.watch("domain") && (
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium">Add this TXT record to your DNS:</p>
                    <div className="grid gap-2 text-xs">
                      <div className="flex items-center justify-between gap-2 rounded bg-background p-2 font-mono">
                        <span className="truncate">
                          <span className="text-muted-foreground">Type:</span> TXT
                          &nbsp;·&nbsp;
                          <span className="text-muted-foreground">Host:</span> @
                          &nbsp;·&nbsp;
                          <span className="text-muted-foreground">Value:</span>{" "}
                          <span className="text-primary">{verifyToken}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => navigator.clipboard.writeText(verifyToken)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      DNS propagation can take up to 24 hours. TTL of 300s is recommended.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleVerify}
                        disabled={verifyState === "checking"}
                      >
                        {verifyState === "checking" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {verifyState === "checking" ? "Checking…" : "Verify Domain"}
                      </Button>
                      {verifyState === "verified" && (
                        <span className="flex items-center gap-1 text-sm text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" /> Verified
                        </span>
                      )}
                      {verifyState === "failed" && (
                        <span className="flex items-center gap-1 text-sm text-destructive">
                          <XCircle className="h-4 w-4" /> TXT record not found. DNS may still be propagating.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => { form2.setValue("domain", ""); setStep(3); }}>
                      Skip
                    </Button>
                    <Button type="submit">Continue →</Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Admin Account ── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Account & Plan</CardTitle>
            <CardDescription>Set up the school admin credentials and choose a subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form3}>
              <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form3.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Name *</FormLabel>
                        <FormControl><Input placeholder="Rajan Sharma" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form3.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email *</FormLabel>
                        <FormControl><Input type="email" placeholder="admin@school.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form3.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Admin Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min. 8 characters" {...field} />
                        </FormControl>
                        <FormDescription>The admin can change this after first login</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form3.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Subscription Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a plan (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plans.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — ₹{p.priceMonthly}/mo · {p.maxStudents < 0 ? "Unlimited" : p.maxStudents} students
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>School starts on Trial until payment is confirmed</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                {serverError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {serverError}
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">Provisioning will:</p>
                  <ul className="ml-3 list-disc space-y-0.5">
                    <li>Create MySQL database <code>school_{step1Data?.slug}</code></li>
                    <li>Run schema migrations on the tenant database</li>
                    <li>Seed default fee categories and academic year</li>
                    <li>Create the school admin account</li>
                  </ul>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>← Back</Button>
                  <Button type="submit" disabled={form3.formState.isSubmitting}>
                    {form3.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {form3.formState.isSubmitting ? "Provisioning…" : "Provision School"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { userService } from "@/services/user.service";
import { employeeService } from "@/services/employee.service";
import { departmentService } from "@/services/department.service";
import { golonganService } from "@/services/golongan.service";
import { levelService } from "@/services/level.service";

import { User } from "@/types/user.types";
import { Employee, EmployeeType } from "@/types/employee.types";
import { Department } from "@/types/department.types";
import { Golongan } from "@/types/golongan.types";
import { Level } from "@/types/level.types";

const employeeTypeLabels: Record<EmployeeType, string> = {
  [EmployeeType.TETAP]: "Pegawai Tetap",
  [EmployeeType.KONTRAK]: "Kontrak",
};

// Mode: 'link' (existing employee) or 'create' (new employee)
type EmployeeMode = "link" | "create";

const formSchema = z
  .object({
    // User Fields
    name: z.string().min(1, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .optional()
      .or(z.literal("")),
    nik: z.string().optional(),
    npwp: z.string().optional(),
    birthPlace: z.string().optional(),
    dateOfBirth: z.string().optional(),
    roles: z.array(z.string()).min(1, "Minimal satu role harus dipilih"),

    // Employee Selection
    employeeMode: z.enum(["link", "create"]),
    employeeId: z.string().optional(),

    // New Employee Fields (Required if employeeMode is 'create')
    emp_employeeNumber: z.string().optional(),
    emp_fullName: z.string().optional(),
    emp_departmentId: z.string().optional(),
    emp_golonganId: z.string().optional(),
    emp_employeeType: z
      .enum([EmployeeType.TETAP, EmployeeType.KONTRAK])
      .optional(),
    emp_permanentEmployeeDate: z.string().optional(),
    emp_bankAccountNumber: z.string().optional(),
    emp_bankAccountName: z.string().optional(),

    // Detailed User Settings
    memberVerified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    installmentPlan: z.string().optional(), // Select value is string usually
    avatar: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.employeeMode === "link" && !data.employeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih karyawan yang sudah ada",
        path: ["employeeId"],
      });
    }
    if (data.employeeMode === "create") {
      if (!data.emp_employeeNumber)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nomor Karyawan wajib diisi",
          path: ["emp_employeeNumber"],
        });
      if (!data.emp_fullName)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama Lengkap Karyawan wajib diisi",
          path: ["emp_fullName"],
        });
      if (!data.emp_departmentId)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Department wajib dipilih",
          path: ["emp_departmentId"],
        });
      if (!data.emp_golonganId)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Golongan wajib dipilih",
          path: ["emp_golonganId"],
        });
      if (!data.emp_employeeType)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tipe Karyawan wajib dipilih",
          path: ["emp_employeeType"],
        });
      if (!data.emp_bankAccountNumber)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No. Rekening wajib diisi",
          path: ["emp_bankAccountNumber"],
        });
      if (!data.emp_bankAccountName)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama Rekening wajib diisi",
          path: ["emp_bankAccountName"],
        });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [golongans, setGolongans] = useState<Golongan[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [isLoadingLevels, setIsLoadingLevels] = useState(false);

  const isEdit = !!user;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeMode: "link",
      roles: ["anggota"], // Default role
      password: "",
      emp_employeeType: EmployeeType.TETAP,
      memberVerified: false,
      emailVerified: false,
    },
  });

  const employeeMode = form.watch("employeeMode");

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: "", // Don't show password
        nik: user.nik || "",
        npwp: user.npwp || "",
        birthPlace: user.birthPlace || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        roles: user.roles || [],

        memberVerified: user.memberVerified || false,
        emailVerified: user.emailVerified || false,
        installmentPlan: user.installmentPlan
          ? String(user.installmentPlan)
          : undefined,
        avatar: "", // Avatar editing not supported yet

        employeeMode: "link", // When editing, we usually show linked employee
        employeeId: user.employeeId,

        // No need to populate new employee fields as we are editing user
        emp_employeeType: user.employee?.employeeType || EmployeeType.TETAP,
        emp_employeeNumber: user.employee?.employeeNumber,
        emp_fullName: user.employee?.fullName,
        emp_departmentId: user.employee?.departmentId,
        emp_golonganId: user.employee?.golonganId,
        emp_permanentEmployeeDate: user.employee?.permanentEmployeeDate
          ? new Date(user.employee.permanentEmployeeDate)
              .toISOString()
              .split("T")[0]
          : "",
        emp_bankAccountNumber: user.employee?.bankAccountNumber,
        emp_bankAccountName: user.employee?.bankAccountName,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        nik: "",
        roles: ["anggota"],
        employeeMode: "link",
        emp_employeeType: EmployeeType.TETAP,
        memberVerified: false,
        emailVerified: false,
      });
    }
  }, [user, form]);

  const loadInitialData = async () => {
    setIsLoadingLevels(true);
    try {
      const [empRes, deptRes, golRes, levelRes] = await Promise.all([
        employeeService.getAll({ limit: 100, isActive: true }), // Limit 100 to avoid backend error, use search for specific employees if needed
        departmentService.getAll({ limit: 100 }),
        golonganService.getAll({ limit: 100 }),
        levelService.getAll({ limit: 100 }),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setGolongans(golRes.data);
      setLevels(levelRes.data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data referensi");
    } finally {
      setIsLoadingLevels(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const commonData = {
        name: data.name,
        email: data.email,
        nik: data.nik || undefined,
        npwp: data.npwp || undefined,
        birthPlace: data.birthPlace || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        roles: data.roles,
        password: data.password || undefined,

        memberVerified: data.memberVerified ?? false,
        emailVerified: data.emailVerified ?? false,
        installmentPlan: data.installmentPlan
          ? Number(data.installmentPlan)
          : undefined,
        avatar: data.avatar || undefined,
      };

      if (isEdit && user) {
        // Update
        await userService.update(user.id, {
          ...commonData,
          employeeUpdates: {
            employeeNumber: data.emp_employeeNumber,
            fullName: data.emp_fullName,
            departmentId: data.emp_departmentId,
            golonganId: data.emp_golonganId,
            employeeType: data.emp_employeeType,
            permanentEmployeeDate: data.emp_permanentEmployeeDate
              ? new Date(data.emp_permanentEmployeeDate)
              : null,
            bankAccountNumber: data.emp_bankAccountNumber,
            bankAccountName: data.emp_bankAccountName,
          },
        });
        toast.success("User dan data karyawan berhasil diperbarui");
      } else {
        // Create
        if (!data.password) {
          form.setError("password", {
            message: "Password wajib diisi untuk user baru",
          });
          return;
        }

        let payload: any = {
          ...commonData,
          password: data.password,
        };

        if (data.employeeMode === "link") {
          payload.employeeId = data.employeeId;
        } else {
          payload.newEmployee = {
            employeeNumber: data.emp_employeeNumber!,
            fullName: data.emp_fullName!,
            departmentId: data.emp_departmentId!,
            golonganId: data.emp_golonganId!,
            employeeType: data.emp_employeeType!,
            permanentEmployeeDate: data.emp_permanentEmployeeDate
              ? new Date(data.emp_permanentEmployeeDate)
              : undefined,
            bankAccountNumber: data.emp_bankAccountNumber!,
            bankAccountName: data.emp_bankAccountName!, // Should be same as user name ideally, but let's keep separate
          };
        }

        await userService.create(payload);
        toast.success("User berhasil dibuat");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Tambah User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui informasi user dan data karyawan terkait."
              : "Tambahkan user baru ke sistem. Bisa link ke karyawan ada atau buat baru."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informasi Akun</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap (User)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password{" "}
                        {isEdit && "(Kosongkan jika tidak ingin mengubah)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nik"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIK (KTP)</FormLabel>
                      <FormControl>
                        <Input placeholder="3201..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempat Lahir</FormLabel>
                      <FormControl>
                        <Input placeholder="Jakarta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="memberVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Member Verified</FormLabel>
                        <FormDescription>
                          Status verifikasi anggota
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emailVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Email Verified</FormLabel>
                        <FormDescription>
                          Status verifikasi email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="installmentPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rencana Cicilan (Simpanan Pokok)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih rencana cicilan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1x (Lunas Langsung)</SelectItem>
                        <SelectItem value="2">2x (Dicicil 2 bulan)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Roles</FormLabel>
                      <FormDescription>
                        Pilih role/jabatan user dalam sistem.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {levels.map((level) => (
                        <FormField
                          key={level.id}
                          control={form.control}
                          name="roles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={level.id}
                                className="flex flex-row items-center space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(
                                      level.levelName
                                    )}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            level.levelName,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) =>
                                                value !== level.levelName
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">
                                  {level.levelName.replace(/_/g, " ")}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Employee Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Karyawan</h3>

              {!isEdit && (
                <FormField
                  control={form.control}
                  name="employeeMode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-5"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="link" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {" "}
                              Link Karyawan Ada{" "}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="create" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {" "}
                              Buat Karyawan Baru{" "}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {employeeMode === "link" && !isEdit && (
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Pilih Karyawan</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? employees.find(
                                    (emp) => emp.id === field.value
                                  )?.fullName +
                                  ` (${
                                    employees.find((e) => e.id === field.value)
                                      ?.employeeNumber
                                  })`
                                : "Cari karyawan..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cari nama atau NIK..." />
                            <CommandEmpty>
                              Karyawan tidak ditemukan.
                            </CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {employees.map((emp) => (
                                  <CommandItem
                                    value={
                                      emp.fullName + " " + emp.employeeNumber
                                    }
                                    key={emp.id}
                                    onSelect={() => {
                                      form.setValue("employeeId", emp.id);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        emp.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {emp.fullName} ({emp.employeeNumber})
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Pilih karyawan yang belum memiliki akun user.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Show Employee Fields if creating NEW or EDITING existing */}
              {(employeeMode === "create" || isEdit) && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  {/* Employee Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emp_employeeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Karyawan</FormLabel>
                          <FormControl>
                            <Input placeholder="1000..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emp_fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap Karyawan</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emp_departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.departmentName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emp_golonganId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Golongan</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih golongan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {golongans.map((gol) => (
                                <SelectItem key={gol.id} value={gol.id}>
                                  {gol.golonganName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emp_employeeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Karyawan</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={EmployeeType.TETAP}>
                                Tetap
                              </SelectItem>
                              <SelectItem value={EmployeeType.KONTRAK}>
                                Kontrak
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emp_permanentEmployeeDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Permanen</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emp_bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No. Rekening</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emp_bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemilik Rekening</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

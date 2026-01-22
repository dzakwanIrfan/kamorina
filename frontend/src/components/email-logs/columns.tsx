"use client";

import { ColumnDef } from "@tanstack/react-table";
import { EmailLog, EmailStatus } from "@/types/email-logs.types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Mail,
  RefreshCw,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnsProps {
  onView: (log: EmailLog) => void;
  onResend: (log: EmailLog) => void;
}

export const getColumns = ({
  onView,
  onResend,
}: ColumnsProps): ColumnDef<EmailLog>[] => [
  {
    accessorKey: "sentAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Waktu Kirim
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("sentAt"));
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {format(date, "dd MMM yyyy", { locale: id })}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(date, "HH:mm:ss", { locale: id })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as EmailStatus;

      const variants: Record<
        EmailStatus,
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning"
      > = {
        [EmailStatus.SENT]: "success",
        [EmailStatus.PENDING]: "warning",
        [EmailStatus.FAILED]: "destructive",
      };

      // Custom badge variants mapping if "success" or "warning" are not standard generic variants in your Badge setup
      // Assuming standard shadcn might not have success/warning by default, mapping to closest:
      // SENT -> default (usually black/primary) or outline? Or if you have custom colors.
      // Let's use standard variants + generic tailwind classes if needed, but 'destructive' fits FAILED.
      // 'secondary' works for PENDING.
      // 'default' (or specific class) for SENT.

      let variant: "default" | "secondary" | "destructive" | "outline" =
        "default";
      let className = "";

      if (status === EmailStatus.FAILED) {
        variant = "destructive";
      } else if (status === EmailStatus.PENDING) {
        variant = "secondary";
        className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
      } else if (status === EmailStatus.SENT) {
        variant = "outline";
        className =
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-100/80";
      }

      return (
        <Badge variant={variant} className={className}>
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "recipient",
    header: "Penerima",
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("recipient")}</div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subjek",
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[300px]">
        {row.getValue("subject")}
      </div>
    ),
  },
  {
    accessorKey: "retryCount",
    header: "Retry",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("retryCount")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const log = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(log)}>
              <Eye className="mr-2 h-4 w-4" />
              Lihat Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {log.status === EmailStatus.FAILED && (
              <DropdownMenuItem onClick={() => onResend(log)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Email
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

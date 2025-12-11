import { Metadata } from "next";
import { AllAccountsTable } from "@/components/buku-tabungan/all-accounts-table";

export const metadata: Metadata = {
    title: "Semua Buku Tabungan | Koperasi",
    description: "Lihat semua buku tabungan anggota koperasi",
};

export default function AllAccountsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Semua Buku Tabungan
                </h1>
                <p className="text-muted-foreground">
                    Lihat dan kelola semua buku tabungan anggota koperasi
                </p>
            </div>

            <AllAccountsTable />
        </div>
    );
}

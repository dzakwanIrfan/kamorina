import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Level, UserRole } from "@/types/level.types";
import { User } from "@/types/user.types";
import { levelService } from "@/services/level.service";
import { userService } from "@/services/user.service";
import { handleApiError } from "@/lib/axios";
import { useDebounce } from "@/hooks/use-debounce";

interface LevelUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: Level | null;
  onUpdate: () => void;
}

export function LevelUsersDialog({
  open,
  onOpenChange,
  level,
  onUpdate,
}: LevelUsersDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserRole[]>([]);
  const [levelDetails, setLevelDetails] = useState<Level | null>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch full level details when dialog opens
  useEffect(() => {
    if (open && level) {
      fetchLevelDetails();
    } else {
      setUsers([]);
      setLevelDetails(null);
    }
  }, [open, level]);

  // Search users effect
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const response = await userService.getAll({
          search: debouncedSearch,
          limit: 10,
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch]);

  const fetchLevelDetails = async () => {
    if (!level) return;
    try {
      setIsLoading(true);
      const data = await levelService.getById(level.id);
      setLevelDetails(data);
      setUsers(data.userRoles || []);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!level) return;

    try {
      setIsLoading(true);
      await levelService.assignUser(level.id, { userId });
      toast.success("User berhasil ditambahkan");
      setSearchOpen(false);
      setSearchQuery("");
      fetchLevelDetails();
      onUpdate();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!level) return;

    try {
      setIsLoading(true);
      await levelService.removeUser(level.id, userId);
      toast.success("User berhasil dihapus dari level");
      fetchLevelDetails();
      onUpdate();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Users - {level?.levelName}</DialogTitle>
          <DialogDescription>
            Kelola user yang memiliki level/role {level?.levelName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Registered Users ({users.length})
            </h4>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto w-[200px] justify-between"
                >
                  {searchQuery ? searchQuery : "Cari user..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="end">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search users..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        "User tidak ditemukan."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((user) => {
                        const isAssigned = users.some(
                          (u) => u.user.id === user.id,
                        );
                        return (
                          <CommandItem
                            key={user.id}
                            value={user.id}
                            onSelect={() => handleAssignUser(user.id)}
                            disabled={isAssigned || isLoading}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isAssigned ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="rounded-md border">
            <ScrollArea className="h-[300px]">
              {isLoading && users.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Belum ada user</p>
                    <p className="text-xs text-muted-foreground">
                      Tambahkan user ke level ini menggunakan tombol pencarian
                      di atas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {users.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between space-x-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={role.user.avatar || undefined} />
                          <AvatarFallback>
                            {getInitials(role.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {role.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {role.user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveUser(role.user.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

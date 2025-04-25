
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = 'pharmacist' | 'cashier';

interface RoleSelectProps {
  value: Role;
  onValueChange: (value: Role) => void;
}

export function RoleSelect({ value, onValueChange }: RoleSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select your role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pharmacist">Pharmacist</SelectItem>
        <SelectItem value="cashier">Cashier</SelectItem>
      </SelectContent>
    </Select>
  );
}

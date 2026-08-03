import { Autocomplete, TextField } from '@mui/material';
import type { Employee } from '../types';

interface EmployeeAutocompleteProps {
  employees: Employee[];
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  label?: string;
  disabled?: boolean;
}

export function EmployeeAutocomplete({ employees, value, onChange, label = 'Empleado', disabled }: EmployeeAutocompleteProps) {
  return (
    <Autocomplete
      options={employees}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      disabled={disabled}
      getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeId})`}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

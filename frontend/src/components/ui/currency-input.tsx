"use client";

import * as React from "react";
import { FaRupiahSign } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  /** Current value (numeric) */
  value?: string | number;
  /** Callback when value changes - returns raw numeric string */
  onChange?: (value: string) => void;
  /** Currency symbol to display (default: FaRupiahSign icon) */
  currencySymbol?: React.ReactNode;
  /** Position of currency symbol */
  symbolPosition?: "left" | "right";
  /** Locale for number formatting */
  locale?: string;
  /** Allow decimal values */
  allowDecimals?: boolean;
  /** Maximum decimal places */
  maxDecimalPlaces?: number;
  /** Maximum value allowed */
  maxValue?: number;
  /** Minimum value allowed */
  minValue?: number;
}

/**
 * Format number with thousand separators based on locale
 */
function formatDisplayValue(
  value: string | number,
  locale: string = "id-ID",
  allowDecimals: boolean = false,
  maxDecimalPlaces: number = 2
): string {
  if (value === "" || value === undefined || value === null) return "";

  const numericValue =
    typeof value === "string" ? value.replace(/[^\d.-]/g, "") : String(value);

  if (numericValue === "" || numericValue === "-") return numericValue;

  const parts = numericValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Format integer part with thousand separators
  const num = parseInt(integerPart, 10);
  if (isNaN(num)) return "";

  const formattedInteger = new Intl.NumberFormat(locale).format(num);

  // Handle decimal part if allowed
  if (allowDecimals && decimalPart !== undefined) {
    const truncatedDecimal = decimalPart.slice(0, maxDecimalPlaces);
    return `${formattedInteger},${truncatedDecimal}`;
  }

  return formattedInteger;
}

/**
 * Parse formatted display value back to raw numeric string
 */
function parseToNumericString(
  displayValue: string,
  locale: string = "id-ID"
): string {
  if (!displayValue) return "";

  // Get thousand and decimal separators based on locale
  const thousandSeparator = locale === "id-ID" ? "." : ",";
  const decimalSeparator = locale === "id-ID" ? "," : ".";

  // Remove thousand separators and convert decimal separator
  let numericString = displayValue.replace(
    new RegExp(`\\${thousandSeparator}`, "g"),
    ""
  );
  numericString = numericString.replace(decimalSeparator, ".");

  // Keep only numbers, decimal point, and minus sign
  numericString = numericString.replace(/[^\d.-]/g, "");

  return numericString;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onChange,
      currencySymbol = <FaRupiahSign className="h-4 w-4" />,
      symbolPosition = "left",
      locale = "id-ID",
      allowDecimals = false,
      maxDecimalPlaces = 2,
      maxValue,
      minValue,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display value with external value
    React.useEffect(() => {
      if (!isFocused) {
        const formatted = formatDisplayValue(
          value ?? "",
          locale,
          allowDecimals,
          maxDecimalPlaces
        );
        setDisplayValue(formatted);
      }
    }, [value, locale, allowDecimals, maxDecimalPlaces, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Get the decimal separator based on locale
      const decimalSeparator = locale === "id-ID" ? "," : ".";

      // Allow only numbers and decimal separator
      const cleanedInput = inputValue.replace(
        new RegExp(`[^\\d${decimalSeparator === "," ? "," : "."}]`, "g"),
        ""
      );

      // Handle decimal input
      let processedValue = cleanedInput;
      if (!allowDecimals) {
        processedValue = cleanedInput.replace(/[,.]/g, "");
      } else {
        // Only allow one decimal separator
        const parts = cleanedInput.split(decimalSeparator);
        if (parts.length > 2) {
          processedValue = parts[0] + decimalSeparator + parts.slice(1).join("");
        }
      }

      // Convert to numeric string for validation
      const numericString = parseToNumericString(processedValue, locale);
      const numericValue = parseFloat(numericString);

      // Validate max value - if exceeded, keep the current value
      if (maxValue !== undefined && !isNaN(numericValue) && numericValue > maxValue) {
        // Don't update anything, keep current display value
        return;
      }

      // Validate min value (only if there's a complete number)
      if (
        minValue !== undefined &&
        numericString !== "" &&
        !isNaN(numericValue) &&
        numericValue < minValue
      ) {
        // Allow typing but still update the display for better UX
      }

      // Format for display
      const formatted = formatDisplayValue(
        numericString,
        locale,
        allowDecimals,
        maxDecimalPlaces
      );

      // Handle case where user is typing decimal
      if (allowDecimals && processedValue.endsWith(decimalSeparator)) {
        setDisplayValue(formatted + decimalSeparator);
      } else {
        setDisplayValue(formatted);
      }

      // Call onChange with raw numeric string
      onChange?.(numericString);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      // Re-format on blur
      const numericString = parseToNumericString(displayValue, locale);
      const formatted = formatDisplayValue(
        numericString,
        locale,
        allowDecimals,
        maxDecimalPlaces
      );
      setDisplayValue(formatted);

      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        {currencySymbol && symbolPosition === "left" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
            {currencySymbol}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            currencySymbol && symbolPosition === "left" && "pl-10",
            currencySymbol && symbolPosition === "right" && "pr-10",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
        {currencySymbol && symbolPosition === "right" && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
            {currencySymbol}
          </span>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
export type { CurrencyInputProps };

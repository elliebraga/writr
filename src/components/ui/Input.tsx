import * as React from "react";
import { Input as LettersInput, type InputProps as LettersInputProps } from "letters-ds";

export interface InputProps extends Omit<LettersInputProps, "error" | "leftIcon" | "rightIcon"> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, errorMessage, leftIcon, startIcon, rightIcon, endIcon, helperText, label, className, ...props }, ref) => {
    return (
      <LettersInput
        ref={ref}
        label={label}
        helperText={helperText}
        errorMessage={error || errorMessage}
        startIcon={leftIcon || startIcon}
        endIcon={rightIcon || endIcon}
        className={className}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
export { Input };

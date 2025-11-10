import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "", color: "" };

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    // Calculate score
    if (checks.length) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.numbers) score += 20;
    if (checks.special) score += 20;

    // Determine label and color
    if (score <= 40) {
      return { score, label: "Weak", color: "bg-destructive" };
    } else if (score <= 60) {
      return { score, label: "Fair", color: "bg-orange-500" };
    } else if (score <= 80) {
      return { score, label: "Good", color: "bg-yellow-500" };
    } else {
      return { score, label: "Strong", color: "bg-green-500" };
    }
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Progress value={strength.score} className="h-2" />
        <span className="text-xs font-medium min-w-[50px]">{strength.label}</span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Password should contain:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-2">
          <li className={password.length >= 8 ? "text-green-600" : ""}>
            At least 8 characters
          </li>
          <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-600" : ""}>
            Upper & lowercase letters
          </li>
          <li className={/\d/.test(password) ? "text-green-600" : ""}>
            Numbers
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>
            Special characters (!@#$%^&*)
          </li>
        </ul>
      </div>
    </div>
  );
};

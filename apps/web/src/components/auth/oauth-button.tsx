import type { IconType } from "react-icons/lib";
import type { MouseEventHandler } from "react";
import { Button } from "../ui/button";

type Props = Readonly<{
  disabled: boolean;
  label: string;
  Icon: IconType;
  onClick: MouseEventHandler<HTMLButtonElement>;
}>;

export default function OAuthButton({ disabled, label, Icon, onClick }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex gap-x-2 items-center">
        <Icon size={16} />
        {label}
      </div>
    </Button>
  );
}

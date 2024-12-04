import clsx from "clsx";

interface ButtonProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

export const Button = ({ className, children, onClick }: ButtonProps) => {
  return (
    <button
      className={clsx("py-2 px-5 rounded-md border-2", className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

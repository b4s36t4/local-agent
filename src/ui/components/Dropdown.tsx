import clsx from "clsx";
import { useCallback } from "react";

interface DropdownItem {
  className?: string;
  label: React.ReactNode;
  onClick?: () => void;
  id: string;
}

interface DropdownProps {
  items: DropdownItem[];
  onChange?: (value?: any) => void;
  containerClassName?: string;
  children: React.ReactNode;
  position?: "bottom-right" | "bottom-left";
}
export const Dropdown = ({
  items,
  containerClassName,
  children,
  position = "bottom-left",
  onChange,
}: DropdownProps) => {
  const onItemClick = useCallback(function (this: DropdownItem) {
    if (onChange) {
      onChange(this.id);
    }
    this.onClick?.();
  }, []);

  return (
    <div
      className={clsx(
        "relative group transition-all cursor-pointer duration-200 w-auto",
        containerClassName
      )}
    >
      {children}
      <div
        className={clsx(
          "absolute hidden group-hover:block duration-200 bg-white dark:text-gray-200 dark:bg-gray-500 shadow-lg rounded-md p-3 mt-1 ",
          {
            "left-0": position === "bottom-right",
            "right-0": position === "bottom-left",
          }
        )}
      >
        {items.map((item) => {
          return (
            <div
              key={item.id}
              role="none"
              onClick={onItemClick.bind(item)}
              className={clsx(item.className, "cursor-pointer")}
            >
              <div className="w-full select-none cursor-pointer text-sm whitespace-nowrap">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

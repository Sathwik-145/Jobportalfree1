import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// react-day-picker v9 class names
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto w-full max-w-md mx-auto", className)}
      classNames={{
        root: "relative",
        months: "relative flex flex-col sm:flex-row gap-4 w-full",
        month: "w-full space-y-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-sm font-semibold",
        nav: "absolute top-0 inset-x-0 flex h-9 items-center justify-between px-1 z-10",
        button_previous: "h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-muted",
        button_next: "h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-muted",
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday: "flex-1 min-w-9 sm:min-w-10 text-center text-[0.75rem] font-medium text-muted-foreground",
        week: "flex w-full mt-1",
        day: "relative flex-1 min-w-9 sm:min-w-10 h-9 sm:h-10 p-0 text-center text-sm",
        day_button:
          "h-full w-full inline-flex items-center justify-center rounded-md font-normal text-foreground hover:bg-muted hover:text-foreground transition-colors",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:font-semibold [&>button]:hover:bg-primary",
        range_start: "rounded-l-md bg-primary/20 [&>button]:bg-primary [&>button]:text-primary-foreground",
        range_end: "rounded-r-md bg-primary/20 [&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle:
          "bg-primary/20 rounded-none [&>button]:!bg-transparent [&>button]:!text-foreground [&>button]:rounded-none",
        today: "[&>button]:ring-1 [&>button]:ring-primary",
        outside: "opacity-40",
        disabled: "opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }: any) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      } as any}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

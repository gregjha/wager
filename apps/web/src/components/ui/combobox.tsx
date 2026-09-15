"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

type Item = {
  value: string;
  label: string;
};

interface ItemsList {
  itemsFlat: readonly Item[];
  itemsGrouped?: never;
}

interface GroupedItems {
  itemsFlat?: never;
  itemsGrouped: { [group: string]: Readonly<Item[]> };
}

type CommandItems = ItemsList | GroupedItems;

type ButtonProps = React.ComponentProps<typeof Button> &
  Readonly<{
    placeholder?: string;
  }>;

type Props = Readonly<{
  buttonProps?: ButtonProps;
  commandProps?: {
    placeholder?: string;
  };
  items: CommandItems;
  value: string | null;
  onChange: (value: string) => void;
}>;

export function Combobox({
  buttonProps,
  commandProps,
  items,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const itemsFlattened =
    items.itemsFlat ?? Object.values(items.itemsGrouped).flat();

  const item = itemsFlattened.find((item) => item.value === value);

  const [search, setSearch] = useState("");

  const onSelect = (newValue: string) => {
    onChange(newValue);
    setOpen(false);
  };

  const itemListProps = {
    items,
    placeholder: commandProps?.placeholder,
    value: search,
    onSelect,
    onValueChange: setSearch,
  };

  const { placeholder, variant, ...buttonAttributes } = buttonProps || {};

  const comboboxButton = (
    <Button
      {...buttonAttributes}
      variant={variant || "outline"}
      className="justify-between hover:bg-accent/30"
    >
      {item ? item.label : placeholder || "Select value"}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild={true}>{comboboxButton}</PopoverTrigger>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width) max-h-(--radix-popover-content-available-height)"
          align="start"
        >
          <ItemList {...itemListProps} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild={true}>{comboboxButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle className="hidden">
          {buttonProps?.placeholder || "Select value"}
        </DrawerTitle>
        <div className="mt-4 border-t">
          <ItemList {...itemListProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ItemList({
  placeholder,
  items: { itemsFlat, itemsGrouped },
  value,
  onSelect,
  onValueChange,
}: {
  placeholder?: string;
  items: CommandItems;
  value: string;
  onSelect: (value: string) => void;
  onValueChange: (value: string) => void;
}) {
  const ItemElement = ({ item }: { item: Item }) => (
    <CommandItem
      data-value={`${item.label} ${item.value}`}
      onSelect={() => {
        onSelect(item.value);
      }}
    >
      {item.label} ({item.value})
    </CommandItem>
  );

  return (
    <Command>
      <CommandInput
        placeholder={placeholder || "Search values"}
        value={value}
        onValueChange={onValueChange}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {itemsFlat && (
          <CommandGroup>
            {itemsFlat.map((item) => (
              <ItemElement key={item.value} item={item} />
            ))}
          </CommandGroup>
        )}
        {itemsGrouped &&
          Object.entries(itemsGrouped).map(([group, items], index, groups) => (
            <div key={group}>
              <CommandGroup heading={group}>
                {items.map((item) => (
                  <ItemElement key={item.value} item={item} />
                ))}
              </CommandGroup>
              {index < groups.length - 1 && <CommandSeparator />}
            </div>
          ))}
      </CommandList>
    </Command>
  );
}

// Compound components (namespace pattern) - REFACTORED
export { Accordion } from './accordion.js';
export { Alert } from './alert.js';
export { AlertDialog } from './alert-dialog.js';
export { Avatar } from './avatar.js';
export { Breadcrumb } from './breadcrumb.js';
export { Card } from './card.js';
export { Collapsible } from './collapsible.js';
export { ContextMenu } from './context-menu.js';
export { Dialog } from './dialog.js';
export { DropdownMenu } from './dropdown-menu.js';
export { HoverCard } from './hover-card.js';
export {
  NavigationMenu,
  navigationMenuTriggerStyle,
} from './navigation-menu.js';
export { Popover } from './popover.js';
export { RadioGroup } from './radio-group.js';
export { Select } from './select.js';
export { Sheet } from './sheet.js';
export { Table } from './table.js';
export { Tabs } from './tabs.js';
export { Tooltip } from './tooltip.js';

// Compound components (namespace pattern) - REFACTORED
export { Carousel, type CarouselApi } from './carousel.js';
export { Chart, type ChartConfig } from './chart.js';
export { Command } from './command.js';
export { Drawer } from './drawer.js';
export { InputOTP } from './input-otp.js';
export { Menubar } from './menubar.js';
export { Pagination } from './pagination.js';
export { ResizablePanelGroup } from './resizable.js';
export { ScrollArea, ScrollBar } from './scroll-area.js';
export { ToggleGroup } from './toggle-group.js';

// Sidebar components (from sidebar folder)
export {
  NavMain,
  NavSecondary,
  NavUser,
  Sidebar,
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from './sidebar/index.js';

// Compound components (already using namespace pattern)
export * from './form.js';

// Simple components (no sub-components)
export * from './aspect-ratio.js';
export * from './badge.js';
export * from './banner.js';
export * from './button.js';
export * from './button-group.js';
export * from './calendar.js';
export * from './checkbox.js';
export * from './empty.js';
// Field components (excluding FieldDescription and FieldError which are in form.js)
export {
  Field,
  FieldLabel,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from './field.js';
export * from './input.js';
export * from './input-group.js';
export * from './item.js';
export * from './kbd.js';
export * from './label.js';
export * from './progress.js';
export * from './separator.js';
export * from './skeleton.js';
export * from './slider.js';
export * from './sonner.js';
export * from './spinner.js';
export * from './switch.js';
export * from './textarea.js';
export * from './toggle.js';

import {
  Armchair,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Banknote,
  Bell,
  Bike,
  Bus,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  Clock,
  Compass,
  Crown,
  GlassWater,
  Heart,
  House,
  Info,
  LayoutGrid,
  MapPin,
  Menu,
  Minus,
  Music,
  Navigation,
  Package,
  Phone,
  Play,
  Plus,
  QrCode,
  Receipt,
  ReceiptText,
  Route,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Soup,
  Star,
  Store,
  Ticket,
  TicketCheck,
  Timer,
  Truck,
  User,
  UtensilsCrossed,
  Wallet,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * Flash's icon set.
 *
 * One library (Lucide) drawn on a 24×24 grid with a 1.75 stroke, round caps and
 * round joins — the same optical weight as the reference app's line icons, so
 * icons and type sit on the same visual footing at any size. The semantic names
 * below are Flash's own vocabulary; the glyph behind each one is the library's,
 * which keeps the set modern and consistent instead of hand-drawn per feature.
 */
export type IconName =
  | "home"
  | "events"
  | "ride"
  | "food"
  | "ticket"
  | "ticket-stub"
  | "bookings"
  | "track"
  | "profile"
  | "search"
  | "filter"
  | "chevron-right"
  | "chevron-left"
  | "chevron-down"
  | "arrow-right"
  | "arrow-up-right"
  | "share"
  | "heart"
  | "map-pin"
  | "navigation"
  | "route"
  | "clock"
  | "calendar"
  | "swap"
  | "crown"
  | "music"
  | "drink"
  | "check"
  | "check-circle"
  | "bell"
  | "settings"
  | "help"
  | "info"
  | "phone"
  | "minus"
  | "plus"
  | "close"
  | "play"
  | "dot"
  | "user"
  | "star"
  | "bike"
  | "car"
  | "van"
  | "bowl"
  | "bag"
  | "wallet"
  | "receipt"
  | "banknote"
  | "lightning"
  | "seat"
  | "package"
  | "truck"
  | "qr"
  | "timer"
  | "send"
  | "menu"
  | "dashboard"
  | "store";

const ICONS: Record<IconName, LucideIcon> = {
  home: House,
  events: Compass,
  ride: Car,
  food: UtensilsCrossed,
  ticket: Ticket,
  "ticket-stub": TicketCheck,
  bookings: ReceiptText,
  track: Package,
  profile: User,
  search: Search,
  filter: SlidersHorizontal,
  "chevron-right": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-down": ChevronDown,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  share: Share2,
  heart: Heart,
  "map-pin": MapPin,
  navigation: Navigation,
  route: Route,
  clock: Clock,
  calendar: CalendarDays,
  swap: ArrowUpDown,
  crown: Crown,
  music: Music,
  drink: GlassWater,
  check: Check,
  "check-circle": CircleCheck,
  bell: Bell,
  settings: SlidersHorizontal,
  help: CircleHelp,
  info: Info,
  phone: Phone,
  minus: Minus,
  plus: Plus,
  close: X,
  play: Play,
  dot: Circle,
  user: User,
  star: Star,
  bike: Bike,
  car: Car,
  van: Bus,
  bowl: Soup,
  bag: Package,
  wallet: Wallet,
  receipt: Receipt,
  banknote: Banknote,
  lightning: Zap,
  seat: Armchair,
  package: Package,
  truck: Truck,
  qr: QrCode,
  timer: Timer,
  send: Send,
  menu: Menu,
  dashboard: LayoutGrid,
  store: Store,
};

/** Glyphs that take a solid fill when the design calls for an active state. */
const FILLABLE: IconName[] = ["heart", "star", "play", "dot", "package", "bag", "ticket"];

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  size?: number;
  /** Renders a heavier stroke, and a solid fill where the glyph allows one. */
  filled?: boolean;
}

export function Icon({ name, size = 24, filled = false, ...props }: IconProps) {
  const Component = ICONS[name];
  const solid = filled && FILLABLE.includes(name);

  return (
    <Component
      width={size}
      height={size}
      strokeWidth={filled ? 2.25 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={solid ? "currentColor" : "none"}
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}

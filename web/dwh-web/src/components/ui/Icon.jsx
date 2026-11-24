import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChartColumn,
  ChartPie,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Clock,
  Database,
  Eye,
  EyeOff,
  Globe,
  LayoutDashboard,
  ListFilter,
  SlidersHorizontal,
  LogOut,
  Menu,
  Package,
  Pencil,
  Play,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Table,
  Trash2,
  TriangleAlert,
  Truck,
  Users,
  UsersRound,
  Wallet,
  Warehouse,
  Workflow,
  X,
} from 'lucide-react'

const ICONS = {
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  calendar: CalendarDays,
  cart: ShoppingCart,
  chart: ChartColumn,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronsUpDown: ChevronsUpDown,
  circleCheck: CircleCheck,
  circleX: CircleX,
  clock: Clock,
  close: X,
  customers: UsersRound,
  dashboard: LayoutDashboard,
  database: Database,
  eye: Eye,
  eyeOff: EyeOff,
  delete: Trash2,
  edit: Pencil,
  filter: ListFilter,
  filters: SlidersHorizontal,
  globe: Globe,
  logout: LogOut,
  menu: Menu,
  package: Package,
  play: Play,
  plus: Plus,
  receipt: ReceiptText,
  retry: RefreshCw,
  search: Search,
  segments: ChartPie,
  shield: ShieldCheck,
  table: Table,
  truck: Truck,
  users: Users,
  wallet: Wallet,
  warehouse: Warehouse,
  warning: TriangleAlert,
  workflow: Workflow,
}

/**
 * Vector icon by name. Icons are decorative unless a title is given; the text next to them carries the meaning.
 */
export default function Icon({ name, size = 18, className = '', title }) {
  const Component = ICONS[name]
  if (!Component) {
    return null
  }
  return (
    <Component
      size={size}
      className={`icon ${className}`.trim()}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      role={title ? 'img' : undefined}
      strokeWidth={1.8}
    />
  )
}

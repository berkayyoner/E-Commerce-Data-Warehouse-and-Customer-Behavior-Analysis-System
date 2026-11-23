import {
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Table,
  Truck,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from 'lucide-react'

const ICONS = {
  cart: ShoppingCart,
  chart: ChartColumn,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  clock: Clock,
  close: X,
  dashboard: LayoutDashboard,
  database: Database,
  filters: SlidersHorizontal,
  globe: Globe,
  logout: LogOut,
  menu: Menu,
  package: Package,
  receipt: ReceiptText,
  retry: RefreshCw,
  search: Search,
  shield: ShieldCheck,
  table: Table,
  truck: Truck,
  users: Users,
  wallet: Wallet,
  warning: TriangleAlert,
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

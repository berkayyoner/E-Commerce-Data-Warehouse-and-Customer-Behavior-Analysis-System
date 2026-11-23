import {
  ArrowDown,
  ArrowUp,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Database,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
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
  Wallet,
  Workflow,
  X,
} from 'lucide-react'

const ICONS = {
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  cart: ShoppingCart,
  chart: ChartColumn,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronsUpDown: ChevronsUpDown,
  circleCheck: CircleCheck,
  circleX: CircleX,
  close: X,
  dashboard: LayoutDashboard,
  database: Database,
  delete: Trash2,
  edit: Pencil,
  globe: Globe,
  logout: LogOut,
  menu: Menu,
  package: Package,
  plus: Plus,
  receipt: ReceiptText,
  retry: RefreshCw,
  search: Search,
  shield: ShieldCheck,
  table: Table,
  truck: Truck,
  users: Users,
  wallet: Wallet,
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

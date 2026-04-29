import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CalendarRange,
  Megaphone,
  Briefcase,
  Users,
  UserCog,
  Upload,
  Download,
  School,
  Building2,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  CheckCircle2,
  CircleAlert,
  Circle,
  CalendarCheck,
  CalendarPlus,
  MessagesSquare,
  Gavel,
  FileSpreadsheet,
  FileText,
  ArrowDownToLine,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Filter,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Bell,
  Mail,
  KeyRound,
  Shield,
  BookOpen,
  Layers,
  Tag as TagIcon,
  Clock,
  MapPin,
  RefreshCw,
  Save,
  Send,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/*
  Icon — single source of truth for icon names used across the app.

  Pages and nav configs reference icons by string key (e.g. "dashboard"),
  which keeps NavItem JSON-serializable and avoids importing lucide
  components in dozens of places. This component resolves the key to
  the underlying lucide icon, with a sensible fallback.
*/

export type IconName =
  // dashboard / nav
  | "dashboard"
  | "calendar"
  | "calendar-days"
  | "calendar-range"
  | "calendar-check"
  | "calendar-plus"
  | "announcements"
  | "briefcase"
  | "users"
  | "user-cog"
  | "upload"
  | "download"
  | "download-line"
  | "school"
  | "building"
  | "graduation"
  | "clipboard"
  | "clipboard-check"
  | "list-checks"
  | "check-circle"
  | "alert-circle"
  | "alert-triangle"
  | "circle"
  | "messages"
  | "gavel"
  | "spreadsheet"
  | "file"
  | "logout"
  | "chevron-left"
  | "chevron-right"
  | "search"
  | "plus"
  | "trash"
  | "edit"
  | "eye"
  | "filter"
  | "x"
  | "check"
  | "loader"
  | "bell"
  | "mail"
  | "key"
  | "shield"
  | "book"
  | "layers"
  | "tag"
  | "clock"
  | "map-pin"
  | "refresh"
  | "save"
  | "send"
  | "settings"
  | "trending-up"
  | "trending-down"
  | "chart"
  | "sparkles";

const REGISTRY: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "calendar-range": CalendarRange,
  "calendar-check": CalendarCheck,
  "calendar-plus": CalendarPlus,
  announcements: Megaphone,
  briefcase: Briefcase,
  users: Users,
  "user-cog": UserCog,
  upload: Upload,
  download: Download,
  "download-line": ArrowDownToLine,
  school: School,
  building: Building2,
  graduation: GraduationCap,
  clipboard: ClipboardList,
  "clipboard-check": ClipboardCheck,
  "list-checks": ListChecks,
  "check-circle": CheckCircle2,
  "alert-circle": CircleAlert,
  "alert-triangle": AlertTriangle,
  circle: Circle,
  messages: MessagesSquare,
  gavel: Gavel,
  spreadsheet: FileSpreadsheet,
  file: FileText,
  logout: LogOut,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  search: Search,
  plus: Plus,
  trash: Trash2,
  edit: Pencil,
  eye: Eye,
  filter: Filter,
  x: X,
  check: Check,
  loader: Loader2,
  bell: Bell,
  mail: Mail,
  key: KeyRound,
  shield: Shield,
  book: BookOpen,
  layers: Layers,
  tag: TagIcon,
  clock: Clock,
  "map-pin": MapPin,
  refresh: RefreshCw,
  save: Save,
  send: Send,
  settings: Settings,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  chart: BarChart3,
  sparkles: Sparkles,
};

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
}

export const Icon = ({
  name,
  size = 16,
  strokeWidth = 1.75,
  color,
  className,
  style,
  "aria-hidden": ariaHidden = true,
}: IconProps) => {
  const Resolved = REGISTRY[name as IconName] ?? Circle;
  return (
    <Resolved
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    />
  );
};

export default Icon;

/*
 * One icon family for the whole app: Tabler Icons.
 *
 * Components import semantic aliases from here instead of pulling individual
 * SVG files. Keeping the aliases in one module makes the icon language
 * auditable and lets us swap a glyph without touching templates. All icons
 * inherit `currentColor` and use Tabler's native 24px / 2px-stroke grid.
 */
import IconAlertTriangle from '@tabler/icons-vue/dist/esm/icons/IconAlertTriangle.mjs';
import IconCircleX from '@tabler/icons-vue/dist/esm/icons/IconCircleX.mjs';
import IconAlertSquareRounded from '@tabler/icons-vue/dist/esm/icons/IconAlertSquareRounded.mjs';
import IconArrowBackUp from '@tabler/icons-vue/dist/esm/icons/IconArrowBackUp.mjs';
import IconArrowsSort from '@tabler/icons-vue/dist/esm/icons/IconArrowsSort.mjs';
import IconArrowForwardUp from '@tabler/icons-vue/dist/esm/icons/IconArrowForwardUp.mjs';
import IconArrowLeft from '@tabler/icons-vue/dist/esm/icons/IconArrowLeft.mjs';
import IconArticle from '@tabler/icons-vue/dist/esm/icons/IconArticle.mjs';
import IconBold from '@tabler/icons-vue/dist/esm/icons/IconBold.mjs';
import IconBrandSafari from '@tabler/icons-vue/dist/esm/icons/IconBrandSafari.mjs';
import IconCheck from '@tabler/icons-vue/dist/esm/icons/IconCheck.mjs';
import IconChevronDown from '@tabler/icons-vue/dist/esm/icons/IconChevronDown.mjs';
import IconChevronRight from '@tabler/icons-vue/dist/esm/icons/IconChevronRight.mjs';
import IconCircleCheck from '@tabler/icons-vue/dist/esm/icons/IconCircleCheck.mjs';
import IconClipboard from '@tabler/icons-vue/dist/esm/icons/IconClipboard.mjs';
import IconCloud from '@tabler/icons-vue/dist/esm/icons/IconCloud.mjs';
import IconCode from '@tabler/icons-vue/dist/esm/icons/IconCode.mjs';
import IconCopy from '@tabler/icons-vue/dist/esm/icons/IconCopy.mjs';
import IconDeviceDesktop from '@tabler/icons-vue/dist/esm/icons/IconDeviceDesktop.mjs';
import IconDevices from '@tabler/icons-vue/dist/esm/icons/IconDevices.mjs';
import IconDots from '@tabler/icons-vue/dist/esm/icons/IconDots.mjs';
import IconDotsVertical from '@tabler/icons-vue/dist/esm/icons/IconDotsVertical.mjs';
import IconDownload from '@tabler/icons-vue/dist/esm/icons/IconDownload.mjs';
import IconEye from '@tabler/icons-vue/dist/esm/icons/IconEye.mjs';
import IconEyeOff from '@tabler/icons-vue/dist/esm/icons/IconEyeOff.mjs';
import IconFeather from '@tabler/icons-vue/dist/esm/icons/IconFeather.mjs';
import IconFileArrowRight from '@tabler/icons-vue/dist/esm/icons/IconFileArrowRight.mjs';
import IconFingerprint from '@tabler/icons-vue/dist/esm/icons/IconFingerprint.mjs';
import IconGlobe from '@tabler/icons-vue/dist/esm/icons/IconGlobe.mjs';
import IconFolder from '@tabler/icons-vue/dist/esm/icons/IconFolder.mjs';
import IconH1 from '@tabler/icons-vue/dist/esm/icons/IconH1.mjs';
import IconHistory from '@tabler/icons-vue/dist/esm/icons/IconHistory.mjs';
import IconInfoCircle from '@tabler/icons-vue/dist/esm/icons/IconInfoCircle.mjs';
import IconItalic from '@tabler/icons-vue/dist/esm/icons/IconItalic.mjs';
import IconKey from '@tabler/icons-vue/dist/esm/icons/IconKey.mjs';
import IconLanguage from '@tabler/icons-vue/dist/esm/icons/IconLanguage.mjs';
import IconLayoutDashboard from '@tabler/icons-vue/dist/esm/icons/IconLayoutDashboard.mjs';
import IconLayoutSidebar from '@tabler/icons-vue/dist/esm/icons/IconLayoutSidebar.mjs';
import IconList from '@tabler/icons-vue/dist/esm/icons/IconList.mjs';
import IconLock from '@tabler/icons-vue/dist/esm/icons/IconLock.mjs';
import IconMenu2 from '@tabler/icons-vue/dist/esm/icons/IconMenu2.mjs';
import IconNotebook from '@tabler/icons-vue/dist/esm/icons/IconNotebook.mjs';
import IconPencil from '@tabler/icons-vue/dist/esm/icons/IconPencil.mjs';
import IconPhotoUp from '@tabler/icons-vue/dist/esm/icons/IconPhotoUp.mjs';
import IconPilcrow from '@tabler/icons-vue/dist/esm/icons/IconPilcrow.mjs';
import IconPin from '@tabler/icons-vue/dist/esm/icons/IconPin.mjs';
import IconPlus from '@tabler/icons-vue/dist/esm/icons/IconPlus.mjs';
import IconRefresh from '@tabler/icons-vue/dist/esm/icons/IconRefresh.mjs';
import IconRestore from '@tabler/icons-vue/dist/esm/icons/IconRestore.mjs';
import IconSearch from '@tabler/icons-vue/dist/esm/icons/IconSearch.mjs';
import IconSettings from '@tabler/icons-vue/dist/esm/icons/IconSettings.mjs';
import IconShare from '@tabler/icons-vue/dist/esm/icons/IconShare.mjs';
import IconShieldLock from '@tabler/icons-vue/dist/esm/icons/IconShieldLock.mjs';
import IconSquareCheck from '@tabler/icons-vue/dist/esm/icons/IconSquareCheck.mjs';
import IconSquarePlus from '@tabler/icons-vue/dist/esm/icons/IconSquarePlus.mjs';
import IconStrikethrough from '@tabler/icons-vue/dist/esm/icons/IconStrikethrough.mjs';
import IconTag from '@tabler/icons-vue/dist/esm/icons/IconTag.mjs';
import IconTool from '@tabler/icons-vue/dist/esm/icons/IconTool.mjs';
import IconTrash from '@tabler/icons-vue/dist/esm/icons/IconTrash.mjs';
import IconTypography from '@tabler/icons-vue/dist/esm/icons/IconTypography.mjs';
import IconX from '@tabler/icons-vue/dist/esm/icons/IconX.mjs';

export {
  IconRefresh as Refresh,
  IconSearch as Search,
  IconSettings as Settings,
  IconSettings as Setting,
  IconNotebook as Notes,
  IconTag as Tag,
  IconTrash as Trash,
  IconPlus as Plus,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconChevronRight as ChevronRight,
  IconChevronDown as ArrowDown,
  IconCircleCheck as CircleCheck,
  IconDots as MoreHorizontal,
  IconFolder as Folder,
  IconLock as Lock,
  IconPin as Pin,
  IconPin as PinV2,
  IconLayoutSidebar as PanelLeft,
  IconTypography as Type,
  IconTool as ToolCase,
  IconCopy as Copy,
  IconArticle as Article,
  IconMenu2 as Menu,
  IconArrowLeft as ArrowLeft,
  IconInfoCircle as Info,
  IconClipboard as Clipboard,
  IconArrowBackUp as Undo,
  IconArrowsSort as Sort,
  IconArrowForwardUp as Redo,
  IconX as X,
  IconDotsVertical as MenuVertical,
  IconPencil as Pencil,
  IconPencil as Edit,
  IconFileArrowRight as FileMove,
  IconHistory as History,
  IconRestore as Restore,
  IconEye as Eye,
  IconEyeOff as EyeOff,
  IconSquareCheck as Task,
  IconList as BulletList,
  IconBold as Bold,
  IconItalic as ItalicSVG,
  IconStrikethrough as Strike,
  IconPhotoUp as ImageUp,
  IconCode as CodeSVG,
  IconPilcrow as Pilcrow,
  IconH1 as H,
  IconKey as CircleKey,
  IconSettings as SettingIcon,
  IconFingerprint as SecurityIcon,
  IconCloud as SyncIcon,
  IconTool as ToolIcon,
  IconInfoCircle as InfoIcon,
  IconDeviceDesktop as PWA,
  IconBrandSafari as Safari,
  IconShare as ShareSquare,
  IconSquarePlus as AddSquare,
  IconLayoutDashboard as Dock,
  IconLanguage as Language,
  IconFeather as Simple,
  IconDevices as Platform,
  IconRefresh as Sync,
  IconShieldLock as Security,
  IconGlobe as Globe,
  IconAlertSquareRounded as AlertSquareRounded,
  IconAlertTriangle as AlertTriangle,
  IconCircleX as CircleX,
  IconDownload as Download,
};

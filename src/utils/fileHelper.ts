export const getFileExtension = (filename?: string): string => {
  if (!filename) return 'FILE';
  const clean = filename.trim();
  const parts = clean.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts.pop()!.toUpperCase();
};

export interface FileBadgeStyle {
  ext: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
}

export const getFileBadgeStyle = (filename?: string): FileBadgeStyle => {
  const ext = getFileExtension(filename);

  switch (ext) {
    case 'PDF':
      return {
        ext: 'PDF',
        bgClass: 'bg-rose-950/80',
        textClass: 'text-rose-400',
        borderClass: 'border-rose-800/80',
        label: 'PDF Document'
      };
    case 'DOC':
    case 'DOCX':
      return {
        ext,
        bgClass: 'bg-blue-950/80',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-800/80',
        label: 'Word Document'
      };
    case 'XLS':
    case 'XLSX':
    case 'CSV':
      return {
        ext,
        bgClass: 'bg-emerald-950/80',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-800/80',
        label: 'Excel Spreadsheet'
      };
    case 'JPG':
    case 'JPEG':
    case 'PNG':
    case 'WEBP':
    case 'GIF':
    case 'SVG':
      return {
        ext,
        bgClass: 'bg-purple-950/80',
        textClass: 'text-purple-300',
        borderClass: 'border-purple-800/80',
        label: 'Image File'
      };
    case 'ZIP':
    case 'RAR':
    case '7Z':
    case 'TAR':
      return {
        ext,
        bgClass: 'bg-amber-950/80',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-800/80',
        label: 'Archive Package'
      };
    case 'DWG':
    case 'CAD':
    case 'DXF':
      return {
        ext,
        bgClass: 'bg-cyan-950/80',
        textClass: 'text-cyan-300',
        borderClass: 'border-cyan-800/80',
        label: 'CAD Drawing'
      };
    case 'TXT':
    case 'RTF':
      return {
        ext,
        bgClass: 'bg-slate-900',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-700',
        label: 'Text File'
      };
    default:
      return {
        ext,
        bgClass: 'bg-slate-950',
        textClass: 'text-cyan-400',
        borderClass: 'border-slate-800',
        label: `${ext} File`
      };
  }
};

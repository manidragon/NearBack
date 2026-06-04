// D:\Mani\Code with Zosh\Backup\source code\frontend\src\util\redableDateTime.ts
export const redableDateTime = (timestamp: string | Date | null | undefined): string => {
  if (!timestamp) {
    return 'N/A';
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"  
  };

  const formatted = date.toLocaleString("en-IN", options);
  
  return formatted.replace(/,\s+(\d{1,2}:\d{2}:\d{2}\s*[AP]M)$/, ' at $1');
};
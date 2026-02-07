import { isChinaRegion } from "@/lib/config/region"

export function useRunbookVideoUrl(): string {
  if (isChinaRegion()) {
    return "https://morncoach-video-1393511432.cos.ap-guangzhou.myqcloud.com/runbook.mp4"
  } else {
    // TODO: Replace with international CDN URL when available
    return "https://morncoach-video-1393511432.cos.ap-guangzhou.myqcloud.com/runbook.mp4"
  }
}

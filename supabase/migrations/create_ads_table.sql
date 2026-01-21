-- 创建广告表
CREATE TABLE IF NOT EXISTS public.advertisements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  position TEXT NOT NULL CHECK (position IN ('top', 'bottom', 'left', 'right', 'bottom-left', 'bottom-right', 'middle')),
  file_url TEXT NOT NULL,
  file_url_cn TEXT,
  file_url_intl TEXT,
  link_url TEXT,
  redirect_url TEXT, -- 别名，兼容link_url
  priority INTEGER DEFAULT 0 NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  impression_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS advertisements_status_idx ON public.advertisements(status);
CREATE INDEX IF NOT EXISTS advertisements_position_idx ON public.advertisements(position);
CREATE INDEX IF NOT EXISTS advertisements_priority_idx ON public.advertisements(priority DESC);
CREATE INDEX IF NOT EXISTS advertisements_dates_idx ON public.advertisements(start_date, end_date);

-- 添加注释
COMMENT ON TABLE public.advertisements IS '广告表';
COMMENT ON COLUMN public.advertisements.id IS '广告ID';
COMMENT ON COLUMN public.advertisements.title IS '广告标题';
COMMENT ON COLUMN public.advertisements.type IS '广告类型：image-图片, video-视频';
COMMENT ON COLUMN public.advertisements.position IS '广告位置：top-顶部, bottom-底部, left-左侧, right-右侧, middle-中部等';
COMMENT ON COLUMN public.advertisements.file_url IS '媒体文件URL';
COMMENT ON COLUMN public.advertisements.file_url_cn IS '国内版文件URL';
COMMENT ON COLUMN public.advertisements.file_url_intl IS '国际版文件URL';
COMMENT ON COLUMN public.advertisements.link_url IS '跳转链接';
COMMENT ON COLUMN public.advertisements.redirect_url IS '跳转链接（别名）';
COMMENT ON COLUMN public.advertisements.priority IS '优先级，数字越大优先级越高';
COMMENT ON COLUMN public.advertisements.status IS '状态：active-激活, inactive-禁用';
COMMENT ON COLUMN public.advertisements.start_date IS '开始日期';
COMMENT ON COLUMN public.advertisements.end_date IS '结束日期';
COMMENT ON COLUMN public.advertisements.click_count IS '点击次数';
COMMENT ON COLUMN public.advertisements.impression_count IS '展示次数';

-- 启用RLS（可选）
-- ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

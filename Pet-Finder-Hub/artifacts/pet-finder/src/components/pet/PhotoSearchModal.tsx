import { useState, useRef } from "react";
import { Link } from "wouter";
import { X, Upload, Camera, Loader2, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { searchByPhoto, getAd, PhotoSearchResult, Ad } from "@/lib/api";

export function PhotoSearchModal({ onClose }: { onClose: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PhotoSearchResult | null>(null);
  const [matchedAd, setMatchedAd] = useState<Ad | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setResult(null);
    setMatchedAd(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const res = await searchByPhoto(file);
      setResult(res);
      if (res.found && res.ad_id) {
        try {
          setMatchedAd(await getAd(res.ad_id));
        } catch {
          /* объявление покажем без превью */
        }
      }
    } catch {
      setError("Не удалось связаться с сервисом поиска. Попробуйте позже.");
    }
    setLoading(false);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setMatchedAd(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Поиск по фото
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Загрузите фотографию животного — нейросеть найдёт самое похожее объявление в базе.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />

        {/* Превью / зона загрузки */}
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden mb-4 aspect-video bg-secondary">
            <img src={preview} alt="Загруженное фото" className="w-full h-full object-contain" />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Анализируем фото…</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-10 mb-4 bg-secondary border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-sm font-semibold text-foreground">Выбрать фотографию</span>
            <span className="text-xs text-muted-foreground">JPG, PNG</span>
          </button>
        )}

        {error && <p className="text-destructive text-sm text-center mb-3">{error}</p>}

        {/* Результат */}
        {result && !loading && (
          <div className="mb-4">
            {result.found ? (
              <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
                <p className="text-sm font-bold text-success mb-3">
                  Найдено похожее животное · схожесть {result.similarity}%
                </p>
                {matchedAd ? (
                  <Link
                    href={`/card/${matchedAd.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 bg-card rounded-xl p-2 hover:shadow-md transition-shadow group"
                  >
                    {matchedAd.photo && (
                      <img
                        src={matchedAd.photo}
                        alt={matchedAd.title}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {matchedAd.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{matchedAd.district} район</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                  </Link>
                ) : (
                  result.ad_id && (
                    <Link
                      href={`/card/${result.ad_id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      Открыть объявление <ArrowRight className="w-4 h-4" />
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="bg-secondary border border-border rounded-2xl p-4 text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Совпадений не найдено</p>
                <p className="text-xs text-muted-foreground">
                  Максимальная схожесть — {result.similarity}%. Попробуйте другое фото.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Кнопки */}
        {preview && !loading && (
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold hover:bg-secondary/80 transition-colors"
          >
            <Search className="w-4 h-4" />
            Загрузить другое фото
          </button>
        )}
      </motion.div>
    </div>
  );
}

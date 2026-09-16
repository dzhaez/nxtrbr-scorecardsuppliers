import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Save, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase, classificacaoMedia, type SupplierWithOrders } from '@/lib/supabase';
import { useI18n } from '@/i18n/LanguageContext';

interface EvaluationFormProps {
  supplier: SupplierWithOrders;
  userId: string;
  ciclo: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function EvaluationForm({ supplier, userId, ciclo, onClose, onSaved }: EvaluationFormProps) {
  const { t } = useI18n();
  const [notas, setNotas] = useState<number[]>([0, 0, 0]);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hover, setHover] = useState<number[]>([0, 0, 0]);

  const questions = [t.question1, t.question2, t.question3];
  const ratingLabels: Record<number, string> = {
    1: t.ratingPoor,
    2: t.ratingGood,
    3: t.ratingGood,
    4: t.ratingExcellent,
    5: t.ratingExcellent,
  };

  const allAnswered = notas.every((n) => n >= 1 && n <= 5);
  const media = allAnswered ? (notas.reduce((a, b) => a + b, 0) / 3) : 0;
  const classif = media > 0
    ? classificacaoMedia(media, {
        poor: t.classificationPoor,
        good: t.classificationGood,
        excellent: t.classificationExcellent,
      })
    : null;

  async function handleSave() {
    if (!allAnswered) {
      setError(t.answerAllQuestions);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('avaliacoes').insert({
        codigo_fornecedor: supplier.codigo_fornecedor,
        id_usuario: userId,
        ciclo,
        nota1: notas[0],
        nota2: notas[1],
        nota3: notas[2],
        media: Math.round(media * 10) / 10,
        comentario: comentario.slice(0, 1000),
      });
      if (insertError) {
        if (insertError.code === '23505') {
          setError(t.alreadyEvaluated);
        } else {
          throw insertError;
        }
        setSaving(false);
        return;
      }
      onSaved();
    } catch (error) {
      console.error('Evaluation save failed:', error);
      setError(t.errorSaving);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{t.evaluationTitle}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {supplier.nome_clas || supplier.razao_social} · CNPJ/CPF {supplier.cnpj_cpf || supplier.codigo_fornecedor}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Questions */}
          {questions.map((q, qi) => (
            <Card key={qi} className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {qi + 1}
                  </span>
                  <span>{q}</span>
                </CardTitle>
                <CardDescription className="text-xs pl-8">{t.mandatoryAnswer}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 pl-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        const next = [...notas];
                        next[qi] = star;
                        setNotas(next);
                      }}
                      onMouseEnter={() => {
                        const next = [...hover];
                        next[qi] = star;
                        setHover(next);
                      }}
                      onMouseLeave={() => {
                        const next = [...hover];
                        next[qi] = 0;
                        setHover(next);
                      }}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`${star} - ${ratingLabels[star]}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hover[qi] || notas[qi]) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30 fill-none'
                        }`}
                      />
                    </button>
                  ))}
                  {notas[qi] > 0 && (
                    <span className="ml-2 text-sm font-medium text-foreground">
                      {notas[qi]} - {ratingLabels[notas[qi]]}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.commentsOptional}</label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 1000))}
              placeholder={t.commentsPlaceholder}
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{comentario.length}/1000</p>
          </div>

          {/* Media preview */}
          {allAnswered && classif && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted animate-fade-in">
              <div>
                <p className="text-sm text-muted-foreground">{t.calculatedAverage}</p>
                <p className="text-3xl font-bold text-foreground">{media.toFixed(1)}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${classif.bg} ${classif.color} font-semibold text-sm`}>
                {classif.label}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!allAnswered || saving} className="flex-1">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.saving}</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {t.saveEvaluation}</>
              )}
            </Button>
          </div>

          {allAnswered && !saving && !error && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 justify-center">
              <CheckCircle2 className="w-4 h-4" /> {t.readyToSave}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Avatar } from '../components/Avatar.jsx';
import { SourceLink } from '../components/ui.jsx';
import { ASPECT_LABEL } from '../content/missions.js';
import { castFor, ORDER } from '../content/cast.js';
import { tx, useLang, useT } from '../i18n.js';
import { ASPECT_LABEL_AR } from '../content/missions.js';

/** Photo of the real inspiration, only if the team put a licensed file in public/inspired/. */
function InspiredPhoto({ file, who }) {
  const [ok, setOk] = useState(true);
  if (!file || !ok) return <div className="insp-photo empty" aria-hidden="true"><span>Photo</span><small>add public/inspired/{file}</small></div>;
  return <img className="insp-photo" src={`./inspired/${file}`} alt={who} onError={() => setOk(false)} />;
}

/** "Meet the council": one card per character, with the real person who inspired them (Expert mode). */
export default function CastPage({ mode, onStart }) {
  const cast = castFor(mode);
  const expert = mode === 'expert';
  const lang = useLang();
  const t = useT();
  const ar = lang === 'ar';
  const I = (c, k) => tx(c.inspired, k, lang);
  return (
    <section className="stage" aria-labelledby="cast-t">
      <div className="wrap">
        <p className="eyebrow">{expert ? t('Expert mode · the council', 'وضع الخبراء · المجلس') : t('Student mode · the crew', 'وضع الطلاب · الطاقم')}</p>
        <h2 className="title" id="cast-t">{expert ? t('Meet the council', 'تعرّف على المجلس') : t('Meet the crew', 'تعرّف على الطاقم')}</h2>
        <p className="lead small">{expert
          ? t('Five specialists, one per aspect, argue about every candidate site; the flight director decides. Each character is original: we borrowed a field and a spirit from a real Arab scientist or astronaut, not their words or personality. Everything the characters say is generated from the data.', 'خمسة متخصصين، واحد لكل جانب، يتناقشون في كل موقع مرشح، ومدير الرحلة يقرر. كل شخصية من ابتكارنا: استلهمنا المجال والروح من عالم أو رائد فضاء عربي حقيقي، لا كلامه ولا شخصيته. وكل ما تقوله الشخصيات مبني على البيانات.')
          : t('Five clumsy crew members, one per aspect, and the wise doctor who keeps the mission on track.', 'خمسة أفراد طاقم غلابة، واحد لكل جانب، والدكتور الحكيم اللي بيحافظ على المهمة.')}</p>
        <ul className="cast-grid">
          {ORDER.map((a) => {
            const c = cast.members[a];
            return (
              <li key={a} className="cast-card panel">
                <div className="cast-top">
                  <Avatar id={a} mood="happy" size={150} />
                  <div>
                    <p className="eyebrow">{ar ? ASPECT_LABEL_AR[a] : ASPECT_LABEL[a]}</p>
                    <h3 className="cast-name">{tx(c, 'name', lang)}</h3>
                    <p className="muted small">{tx(c, 'role', lang)}{c.meaning ? ` · ${tx(c, 'meaning', lang)}` : ''}</p>
                  </div>
                </div>
                {expert ? (
                  <>
                    <p>{tx(c, 'voice', lang)}</p>
                    <dl className="cast-dl">
                      <div><dt>{t('Cares about', 'يهتم بـ')}</dt><dd>{tx(c, 'cares', lang)}</dd></div>
                      <div><dt>{t('Red line', 'خط أحمر')}</dt><dd>{tx(c, 'redLine', lang)}</dd></div>
                      <div><dt>{t('Risk appetite', 'تقبّل المخاطرة')}</dt><dd>{tx(c, 'risk', lang)}</dd></div>
                      <div><dt>{t('Argues', 'حجته')}</dt><dd>{tx(c, 'argues', lang)}</dd></div>
                    </dl>
                    <div className="inspired">
                      <InspiredPhoto file={c.inspired.photo} who={I(c, 'who')} />
                      <div>
                        <p className="eyebrow">{t('Inspired by', 'مستوحاة من')}</p>
                        <p><strong>{I(c, 'who')}</strong> <span className="muted small">· {I(c, 'where')}</span></p>
                        <p className="small">{I(c, 'what')}</p>
                        {c.inspired.source && <SourceLink source={c.inspired.source} />}
                        {c.inspired.photoCredit && <p className="muted small insp-credit">{I(c, 'photoCredit')}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p>{tx(c, 'quirk', lang)}</p>
                    <p className="small muted">{c.job}</p>
                  </>
                )}
              </li>
            );
          })}
          <li className="cast-card panel">
            <div className="cast-top"><Avatar id="leader" mood="happy" size={150} /><div><p className="eyebrow">{t('Decides', 'يقرر')}</p><h3 className="cast-name">{tx(cast.leader, 'name', lang)}</h3><p className="muted small">{tx(cast.leader, 'role', lang)} · {tx(cast.leader, 'meaning', lang)}</p></div></div>
            <p>{expert ? t('Listens to all five, weighs the trade-offs and gives the go / no-go with numbers and dates. Original character.', 'يستمع إلى الخمسة، ويوازن بين المكاسب والمخاطر، ويصدر قرار الهبوط بالأرقام والتواريخ. شخصية من ابتكارنا.') : t('Calm and clever. Fixes the crew’s silly ideas and explains the real science.', 'هادي وذكي. بيصلّح أفكار الطاقم الغلط وبيشرح العلم الحقيقي.')}</p>
          </li>
        </ul>
        {expert && <p className="field-note">{t('Character art by the FASA Destination Team. Dialogue is invented and never attributed to the real people. Photos of the inspirations are shown with respect, to credit the people whose work inspired these characters.', 'رسوم الشخصيات من فريق FASA Destination. الحوار من تأليفنا ولا يُنسب أبدًا إلى الأشخاص الحقيقيين. وصور الملهمين معروضة احترامًا لهم وتقديرًا لأعمالهم التي ألهمت هذه الشخصيات.')}</p>}
        <div className="cta-row"><button type="button" className="btn btn-primary" onClick={onStart}>{t('Start a mission →', 'ابدأ مهمة ←')}</button></div>
      </div>
    </section>
  );
}

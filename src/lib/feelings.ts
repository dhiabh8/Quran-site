import type { FeelingPassageContent, FeelingId, FeelingInfo, VerseRef } from './types'

/**
 * Quran by Feelings — curated editorial content.
 *
 * IMPORTANT: This file deliberately contains NO Qur'anic text. It stores only
 * verified references (surah:ayah) and short editorial reflections. Arabic text
 * and translation are always fetched at runtime from api.alquran.cloud via
 * `fetchVerses()` so the wording is never retyped, generated or altered here.
 *
 * Every reference below was checked against api.alquran.cloud (Uthmani text and
 * Saheeh International). Reflections are editorial, not tafsir. Verified tafsir
 * comes from the existing `useTafsir` hook (api.quran.com).
 */

export const QURAN_TEXT_SOURCE = 'Uthmani script (quran-uthmani) · api.alquran.cloud'
export const TRANSLATION_SOURCE = 'Saheeh International (en.sahih) · api.alquran.cloud'

export const REFLECTION_DISCLAIMER =
  'These passages are offered for spiritual reflection and connection with the Qur’an. They are not medical or psychological advice, and they are not a guaranteed remedy for any condition. If you are struggling, please seek support from qualified professionals and people you trust.'

export const REFLECTION_DISCLAIMER_AR =
  'هذه الآيات للتدبّر الروحي والارتباط بالقرآن، وليست نصيحة طبية أو نفسية، ولا تُعدّ علاجاً مضموناً لأي حالة. إذا كنت تمرّ بضيق، فاطلب الدعم من مختصين ومن تثق بهم.'

export const FEELINGS: FeelingInfo[] = [
  {
    id: 'sad',
    label: 'Sad',
    arabic: 'حزين',
    description: 'When the heart feels heavy',
    descriptionAr: 'حين يثقل القلب',
    intro:
      'The Qur’an does not deny sorrow; it speaks of mercy that is nearer than despair. These passages hold space for grief while gently opening a door to hope.',
    introAr:
      'القرآن لا ينكر الحزن، بل يتحدّث عن رحمة أقرب من اليأس. هذه الآيات تفسح مكاناً للحزن وتفتح باباً هادئاً إلى الرجاء.',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    arabic: 'قلق',
    description: 'When thoughts will not settle',
    descriptionAr: 'حين لا تستقر الأفكار',
    intro:
      'The Qur’an returns again and again to trust, remembrance and reassurance — an invitation to steady the heart, not a promise that difficult feelings vanish instantly.',
    introAr:
      'يعود القرآن مراراً إلى التوكل والذكر والطمأنة؛ دعوة إلى استقرار القلب، لا وعداً بزوال المشاعر الصعبة بين لحظة وأخرى.',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    arabic: 'ممتن',
    description: 'When you want to give thanks',
    descriptionAr: 'حين تريد أن تشكر',
    intro:
      'In the Qur’an, gratitude is both a recognition of blessing and a way of drawing nearer to Allah. These verses turn thankfulness into awareness.',
    introAr:
      'الشكر في القرآن اعتراف بالنعمة ووسيلة للتقرّب إلى الله. هذه الآيات تجعل الامتنان وعياً وصدقاً.',
  },
  {
    id: 'lost',
    label: 'Lost',
    arabic: 'تائه',
    description: 'When the way is unclear',
    descriptionAr: 'حين يغمض الطريق',
    intro:
      'The Qur’an opens with a prayer for guidance. It meets the wandering heart not with certainty demanded, but with a path offered.',
    introAr:
      'يفتتح القرآن بدعاء إلى الهداية، ويواجه القلب التائه لا بطلب اليقين، بل بعرض طريق واضح.',
  },
  {
    id: 'hopeful',
    label: 'Hopeful',
    arabic: 'متفائل',
    description: 'When you want to believe again',
    descriptionAr: 'حين تريد أن تؤمن مجدداً',
    intro:
      'Qur’anic hope rests in Allah’s mercy and in the reminder that hardship is not the end of the story. These passages keep that horizon in view.',
    introAr:
      'الرجاء في القرآن يستند إلى رحمة الله وإلى تذكير بأن الشدة ليست نهاية القصة. هذه الآيات تُبقي هذا الأفق حاضراً.',
  },
  {
    id: 'peace',
    label: 'Seeking Peace',
    arabic: 'أبحث عن السكينة',
    description: 'When you want stillness',
    descriptionAr: 'حين تطلب سكون القلب',
    intro:
      'The Qur’an describes tranquillity as a gift of Allah, closely tied to remembrance, faith and the quiet certainty that He is present.',
    introAr:
      'يصف القرآن السكينة بأنها هبة من الله، مرتبطة بالذكر والإيمان ويقين الحضور الإلهي.',
  },
  {
    id: 'afraid',
    label: 'Afraid',
    arabic: 'خائف',
    description: 'When fear has your attention',
    descriptionAr: 'حين يستحوذ الخوف',
    intro:
      'Rather than denying fear, the Qur’an reframes it: the only fear that is redirected is fear of people, while true safety is found in Allah alone.',
    introAr:
      'القرآن لا ينكر الخوف، بل يعيد توجيهه: يُنهي خوف العباد من الناس، ويجعل الأمان الحقيقي عند الله وحده.',
  },
  {
    id: 'lonely',
    label: 'Lonely',
    arabic: 'أشعر بالوحدة',
    description: 'When you feel on your own',
    descriptionAr: 'حين تشعر بأنك وحدك',
    intro:
      'The Qur’an speaks of Allah’s nearness in the most intimate terms: a remembrance that accompanies a person even in solitude.',
    introAr:
      'يتحدّث القرآن عن قرب الله بألفاظ بالغة الحميمية: ذكر يرافق الإنسان حتى في وحدته.',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    arabic: 'أشعر بالضغط',
    description: 'When everything feels like too much',
    descriptionAr: 'حين يبدو كل شيء أكبر منك',
    intro:
      'The Qur’an acknowledges human capacity and reminds the believer that relief accompanies hardship — an invitation to take the next step, not to carry everything at once.',
    introAr:
      'يقرّ القرآن بحدود الطاقة البشرية ويذكّر بأن العسر يصحبه يسر؛ دعوة إلى الخطوة التالية لا إلى حمل كل شيء دفعة واحدة.',
  },
  {
    id: 'repentant',
    label: 'Repentant',
    arabic: 'أريد التوبة',
    description: 'When you want to begin again',
    descriptionAr: 'حين تريد أن تبدأ من جديد',
    intro:
      'The Qur’an opens the door of return with direct, unambiguous invitations to seek forgiveness — without conditions of perfection.',
    introAr:
      'يفتح القرآن باب العودة بدعوات صريحة إلى الاستغفار، لا بشرط الكمال.',
  },
]

const ref = (surah: number, ayah: number): VerseRef => ({ surah, ayah })

export const FEELING_PASSAGES: Record<FeelingId, FeelingPassageContent[]> = {
  sad: [
    {
      refs: [ref(12, 87)],
      theme: 'Do not lose hope',
      themeAr: 'لا تيأسوا',
      note: 'In a moment of deep distress, Ya‘qub (Jacob) tells his sons not to despair of Allah’s relief. The verse acknowledges anguish while keeping hope open.',
      noteAr: 'في لحظة ضيق شديد، يوصي يعقوب بنيه ألّا ييأسوا من روح الله. الآية تعترف بالألم وتبقي باب الرجاء مفتوحاً.',
    },
    {
      refs: [ref(39, 53)],
      theme: 'Mercy wider than our failing',
      themeAr: 'رحمة أوسع من تقصيرنا',
      note: 'A direct address to those who have wronged themselves: what is forbidden is despair of Allah’s mercy, not hope in it.',
      noteAr: 'نداء مباشر إلى من أسرفوا على أنفسهم: المنهي عنه هو القنوط من رحمة الله، لا الرجاء فيها.',
    },
    {
      refs: [ref(94, 5), ref(94, 6)],
      theme: 'With hardship comes ease',
      themeAr: 'مع العسر يسر',
      note: 'A short declaration repeated in Surah Ash-Sharh. Its repetition is part of the consolation; read it alongside the surah’s opening verses for its full context.',
      noteAr: 'تصريح قصير تكرّر في سورة الشرح، وتكراره جزء من الطمأنة؛ اقرأه مع مطلع السورة لفهم سياقه الكامل.',
    },
    {
      refs: [ref(2, 153)],
      theme: 'Patience and prayer',
      themeAr: 'الصبر والصلاة',
      note: 'Believers are asked to seek help through patience and prayer, with the reassurance that Allah is with those who are patient.',
      noteAr: 'يأمر الله المؤمنين بالاستعانة بالصبر والصلاة، ويطمئنهم بأن الله مع الصابرين.',
    },
  ],
  anxious: [
    {
      refs: [ref(13, 28)],
      theme: 'Hearts at rest in remembrance',
      themeAr: 'طمأنينة القلوب بالذكر',
      note: 'The verse links assurance of the heart to the remembrance of Allah, then states it plainly: “Unquestionably, by the remembrance of Allah hearts are assured.”',
      noteAr: 'تربط الآية بين طمأنينة القلب وذكر الله، ثم تقرّر ذلك صراحةً: ألا بذكر الله تطمئن القلوب.',
    },
    {
      refs: [ref(2, 152)],
      theme: 'Remember Me; I will remember you',
      themeAr: 'اذكروني أذكركم',
      note: 'A concise promise of mutual remembrance, followed by a call to gratitude — a small, repeatable practice rather than a demand for immediate certainty.',
      noteAr: 'وعد مختصر بالذكر المتبادل، يليه أمر بالشكر؛ ممارسة صغيرة يمكن تكرارها، لا مطالبة بيقين فوري.',
    },
    {
      refs: [ref(94, 5), ref(94, 6)],
      theme: 'Hardship and ease together',
      themeAr: 'العسر واليسر',
      note: 'Surah Ash-Sharh places this reassurance directly after the reminder of previous difficulty, so it is read as comfort in an ongoing situation, not as a claim that difficulty never exists.',
      noteAr: 'تضع سورة الشرح هذه الطمأنة بعد تذكير بالمشقة السابقة، فتُقرأ كعزاء في سياق مستمر، لا كنفي لوجود الشدة.',
    },
    {
      refs: [ref(65, 2), ref(65, 3)],
      theme: 'A way out for the God-conscious',
      themeAr: 'مخرج لمن يتقي الله',
      note: 'These verses occur within a legal passage about divorce. The statement that Allah provides a way out and provision from where one does not expect belongs to a wider teaching on God-consciousness — read the full passage for context.',
      noteAr: 'هذه الآيات واردة في سياق تشريعي حول الطلاق، والمخرج والرزق من حيث لا يحتسب جزء من توجيه أعمّ إلى تقوى الله؛ اقرأ النص كاملاً لفهم السياق.',
    },
    {
      refs: [ref(2, 286)],
      theme: 'No soul is charged beyond its capacity',
      themeAr: 'لا يكلف الله نفساً إلا وسعها',
      note: 'The verse sets a limit on what a person is accountable for, and closes with a prayer for mercy — useful when the day feels too large.',
      noteAr: 'تضع الآية حدّاً لما يُحاسَب عليه الإنسان، وتختم بدعاء إلى الرحمة، وهو ما يُفيد حين يبدو اليوم أكبر من طاقته.',
    },
  ],
  grateful: [
    {
      refs: [ref(14, 7)],
      theme: 'Gratitude increases',
      themeAr: 'الشكر يزيد',
      note: 'A proclamation from Allah: gratitude is met with increase, while denial of favors is not attributed to any need on His part.',
      noteAr: 'إعلان رباني: الشكر يُقابل بالزيادة، وكفران النعم لا يُنسب إلى حاجة من الله.',
    },
    {
      refs: [ref(31, 12)],
      theme: 'Gratitude returns to the self',
      themeAr: 'الشكر لنفسه',
      note: 'Luqman is given wisdom with the instruction to be grateful; the verse explains that the benefit of gratitude returns to the grateful person.',
      noteAr: 'يُعلَّم لقمان الحكمة ويُوصى بالشكر، وتبيّن الآية أن عائد الشكر يعود على صاحبه.',
    },
    {
      refs: [ref(2, 152)],
      theme: 'Remember and be grateful',
      themeAr: 'اذكروا واشكروا',
      note: 'Remembrance and gratitude are joined in one short verse, followed by a warning against denial — a compact summary of the grateful posture.',
      noteAr: 'يجمع الذكر والشكر في آية قصيرة، يليها تحذير من الكفران؛ خلاصة موجزة لموقف الشاكر.',
    },
    {
      refs: [ref(2, 172)],
      theme: 'Receive and give thanks',
      themeAr: 'كلوا واشكروا',
      note: 'Gratitude here is tied to the everyday: eating from what has been provided and acknowledging its source.',
      noteAr: 'يرتبط الشكر هنا باليومي: الأكل مما رُزق والإقرار بمصدره.',
    },
  ],
  lost: [
    {
      refs: [ref(1, 6), ref(1, 7)],
      theme: 'The prayer for guidance',
      themeAr: 'دعاء الهداية',
      note: 'The closing verses of Al-Faatiha are a direct request for the straight path — a model for asking when the way is unclear.',
      noteAr: 'خاتمة الفاتحة طلب مباشر للصراط المستقيم، وهو نموذج للسؤال حين يغمض الطريق.',
    },
    {
      refs: [ref(2, 2)],
      theme: 'A guidance for the God-conscious',
      themeAr: 'هدى للمتقين',
      note: 'The Qur’an introduces itself as a book without doubt and a guidance for those who are conscious of Allah — an invitation to approach it with that intention.',
      noteAr: 'يُعرّف القرآن نفسه بأنه كتاب لا ريب فيه وهدى للمتقين؛ دعوة إلى التعامل معه بهذه النية.',
    },
    {
      refs: [ref(17, 82)],
      theme: 'Healing and mercy — read the whole verse',
      themeAr: 'شفاء ورحمة — اقرأ الآية كاملة',
      note: 'This verse describes the Qur’an as healing and mercy for believers, and immediately adds that it increases the wrongdoers in loss. Both halves belong together.',
      noteAr: 'تصف الآية القرآن بأنه شفاء ورحمة للمؤمنين، ثم تضيف فوراً أنه يزيد الظالمين خساراً؛ لا يُقرأ إلا بجزأيه معاً.',
    },
    {
      refs: [ref(6, 153)],
      theme: 'Follow My straight path',
      themeAr: 'اتبعوا صراطي المستقيم',
      note: 'A clear statement that this is Allah’s path, accompanied by a warning against following other ways — presented as guidance, not as an abstract idea.',
      noteAr: 'بيان صريح أن هذا صراط الله، مع تحذير من اتباع السبل الأخرى؛ هدى عملي لا فكرة مجردة.',
    },
  ],
  hopeful: [
    {
      refs: [ref(39, 53)],
      theme: 'Do not despair of mercy',
      themeAr: 'لا تقنطوا من رحمة الله',
      note: 'One of the Qur’an’s most direct calls to hope: Allah forgives all sins for those who turn to Him, and despair is the thing being warned against.',
      noteAr: 'من مباشر دعوات القرآن إلى الرجاء: الله يغفر الذنوب جميعاً لمن تاب، والمنهي عنه هو القنوط.',
    },
    {
      refs: [ref(94, 5), ref(94, 6)],
      theme: 'Ease accompanies hardship',
      themeAr: 'اليسر مع العسر',
      note: 'The repeated phrase in Surah Ash-Sharh is a reminder that difficulty and ease are not separate stories; keep the surah’s opening in view.',
      noteAr: 'التكرار في سورة الشرح تذكير بأن العسر واليسر ليسا قصتين منفصلتين؛ اقرأ الآية مع مطلع السورة.',
    },
    {
      refs: [ref(2, 218)],
      theme: 'Those who strive may hope for mercy',
      themeAr: 'أولئك يرجون رحمة الله',
      note: 'The verse names faith, migration and striving in Allah’s cause, then says such people expect His mercy — hope tied to effort, not to wishful thinking.',
      noteAr: 'تذكر الآية الإيمان والهجرة والجهاد، ثم تخبر أن أولئك يرجون رحمة الله؛ رجاء مقرون بعمل لا بأمنيات.',
    },
    {
      refs: [ref(4, 147)],
      theme: 'Gratitude and belief',
      themeAr: 'الشكر والإيمان',
      note: 'A rhetorical question that removes the distance between human weakness and divine mercy, while affirming that Allah is Appreciative and Knowing.',
      noteAr: 'سؤال استنكاري يقرّب بين ضعف الإنسان ورحمة الله، مع إثبات أن الله شكور عليم.',
    },
  ],
  peace: [
    {
      refs: [ref(13, 28)],
      theme: 'Tranquillity in remembrance',
      themeAr: 'السكينة بالذكر',
      note: 'The verse describes believers whose hearts are assured by Allah’s remembrance, then concludes that hearts find rest in it alone.',
      noteAr: 'تصف الآية مؤمنين تطمئن قلوبهم بذكر الله، ثم تختم بأن القلوب بذكره تطمئن.',
    },
    {
      refs: [ref(48, 4)],
      theme: 'Tranquillity sent down',
      themeAr: 'تنزيل السكينة',
      note: 'Surah Al-Fath names tranquillity as something Allah sent into the hearts of the believers so that their faith would grow — a gift, not a self-made state.',
      noteAr: 'تُسمّي سورة الفتح السكينةَ شيئاً أنزله الله في قلوب المؤمنين ليزدادوا إيماناً؛ هبة لا حالة يُنشئها الإنسان وحده.',
    },
    {
      refs: [ref(89, 27)],
      theme: 'The reassured soul',
      themeAr: 'النفس المطمئنة',
      note: 'An address to “the reassured soul” near the end of Surah Al-Fajr. Read it with the verses that follow and with the surah’s opening description of a night of stillness.',
      noteAr: 'خطاب إلى «النفس المطمئنة» في ختام سورة الفجر؛ اقرأه مع ما بعده ومع وصف ليلة السكون في مطلع السورة.',
    },
    {
      refs: [ref(2, 153)],
      theme: 'Patience and prayer',
      themeAr: 'الصبر والصلاة',
      note: 'A practical companion to the search for stillness: seeking help through patience and prayer, with the reassurance of Allah’s presence.',
      noteAr: 'رفيق عملي لطلب السكينة: الاستعانة بالصبر والصلاة، مع طمأنة بحضور الله.',
    },
  ],
  afraid: [
    {
      refs: [ref(10, 62)],
      theme: 'No fear for Allah’s allies',
      themeAr: 'لا خوف على أولياء الله',
      note: 'A categorical statement about those who are close to Allah: no fear concerning them, and no grief. Its context is the people of faith, not a blanket claim about never feeling afraid.',
      noteAr: 'بيان قاطع عن أولياء الله: لا خوف عليهم ولا هم يحزنون، وسياقه أهل الإيمان لا دعوى عامة بعدم الخوف أبداً.',
    },
    {
      refs: [ref(3, 175)],
      theme: 'Fear Me, not them',
      themeAr: 'فلا تخافوهم وخافوني',
      note: 'The verse addresses intimidation by opponents and redirects fear toward Allah — a reframing of fear, not a denial that danger can be real.',
      noteAr: 'تتحدّث الآية عن تخويف الخصوم وتوجّه الخوف إلى الله؛ إعادة تأطير للخوف لا إنكاراً لاحتمال الخطر.',
    },
    {
      refs: [ref(2, 112)],
      theme: 'Whoever submits and does good',
      themeAr: 'من أسلم وجهه وهو محسن',
      note: 'A concise statement of reward and safety for the person who turns to Allah and acts well, repeated elsewhere in the Qur’an.',
      noteAr: 'بيان مختصر عن الأجر والأمان لمن أسلم وجهه لله وهو محسن، وقد تكرّر نظيره في مواضع أخرى.',
    },
  ],
  lonely: [
    {
      refs: [ref(2, 186)],
      theme: '“Indeed, I am near”',
      themeAr: 'إني قريب',
      note: 'Perhaps the most intimate verse about Allah’s nearness: He responds to the invocation of the caller. The surrounding verses set out the limits of what a human being may ask for.',
      noteAr: 'من حميم الآيات في قرب الله: يجيب دعوة الداعي إذا دعاه، والآيات حولها تبيّن حدود ما يسأله الإنسان.',
    },
    {
      refs: [ref(50, 16)],
      theme: 'Closer than the jugular vein',
      themeAr: 'أقرب إليه من حبل الوريد',
      note: 'The verse begins with creation and knowledge of what the soul whispers, then states Allah’s closeness in unusually physical imagery.',
      noteAr: 'تبدأ الآية بالخلق والعلم بما توسوس به النفس، ثم تقرّب القرب الإلهي بصورة حسّية بالغة.',
    },
    {
      refs: [ref(2, 152)],
      theme: 'Remember Me; I will remember you',
      themeAr: 'اذكروني أذكركم',
      note: 'Remembrance is described as two-way: the human act of remembering and Allah’s response of remembering — companionship in solitude.',
      noteAr: 'الذكر هنا متبادل: ذكر الإنسان وذكر الله له؛ معنى للمرافقة في الوحدة.',
    },
  ],
  overwhelmed: [
    {
      refs: [ref(2, 286)],
      theme: 'Only within capacity',
      themeAr: 'لا يكلف الله نفساً إلا وسعها',
      note: 'A clear boundary around what a person is asked to carry, followed by a prayer for forgiveness and mercy. The verse is among the most frequently recited for this reason.',
      noteAr: 'حدّ واضح لما يُطلب من الإنسان حمله، يليه دعاء بالمغفرة والرحمة، ولذلك كثيراً ما يُقرأ.',
    },
    {
      refs: [ref(65, 2), ref(65, 3)],
      theme: 'A way out and provision',
      themeAr: 'مخرج ورزق',
      note: 'Within a legal passage about divorce, these verses teach that God-consciousness brings a way out and provision from unexpected quarters. Read the surrounding verses rather than isolating the phrase.',
      noteAr: 'في سياق تشريعي حول الطلاق، تعليم هذه الآيات أن التقوى تجلب مخرجاً ورزقاً من حيث لا يُحتسب؛ اقرأ الآيات المجاورة ولا تكتفي بعبارة واحدة.',
    },
    {
      refs: [ref(94, 5), ref(94, 6)],
      theme: 'Ease with hardship',
      themeAr: 'مع العسر يسر',
      note: 'The repetition in Surah Ash-Sharh offers reassurance without denying the hardship that came before it.',
      noteAr: 'تكرار العبارة في سورة الشرح يقدّم طمأنة دون إنكار الشدة التي سبقتها.',
    },
    {
      refs: [ref(2, 153)],
      theme: 'Seek help through patience and prayer',
      themeAr: 'استعينوا بالصبر والصلاة',
      note: 'A short, practical instruction paired with the reminder that Allah is with those who are patient.',
      noteAr: 'توجيه عملي موجز مقرون بتذكير بأن الله مع الصابرين.',
    },
  ],
  repentant: [
    {
      refs: [ref(39, 53)],
      theme: 'The door stays open',
      themeAr: 'الباب مفتوح',
      note: 'No sin is too large for this address: Allah forgives all sins for those who turn to Him, and the only despair warned against is despair of His mercy.',
      noteAr: 'لا ذنب أكبر من هذا النداء: الله يغفر الذنوب جميعاً لمن تاب، واليأس المحذّر منه هو اليأس من رحمته.',
    },
    {
      refs: [ref(3, 135)],
      theme: 'Remember, then seek forgiveness',
      themeAr: 'ذكروا فاستغفروا',
      note: 'The verse describes people who, after a wrong, remember Allah, seek forgiveness and do not persist — a pattern of return rather than perfection.',
      noteAr: 'تصف الآية قوماً إذا أخطأوا ذكروا الله واستغفروا ولم يُصرّوا؛ نمط عودة لا كمال.',
    },
    {
      refs: [ref(4, 110)],
      theme: 'Allah is Forgiving and Merciful',
      themeAr: 'غفور رحيم',
      note: 'Whoever wrongs himself and then seeks forgiveness will find Allah Forgiving and Merciful — the outcome is stated plainly.',
      noteAr: 'من يظلم نفسه ثم يستغفر الله يجده غفوراً رحيماً؛ النتيجة مذكورة بوضوح.',
    },
    {
      refs: [ref(66, 8)],
      theme: 'Sincere repentance',
      themeAr: 'توبة نصوحة',
      note: 'Believers are commanded to repent with sincere repentance, with a reminder that Allah may remove their difficulties and increase them from His bounty.',
      noteAr: 'يُأمر المؤمنون بالتوبة النصوحة، مع تذكير بأن الله قد يكفّر عنهم سيئاتهم ويزيدهم من فضله.',
    },
  ],
}

export function getFeeling(id: FeelingId): FeelingInfo | undefined {
  return FEELINGS.find((feeling) => feeling.id === id)
}

export function getFeelingPassages(id: FeelingId): FeelingPassageContent[] {
  return FEELING_PASSAGES[id] ?? []
}

export function getFeelingRefs(id: FeelingId): VerseRef[] {
  return getFeelingPassages(id).flatMap((passage) => passage.refs)
}

# HRanalysis — البنية الاساسية للمقاولات

نظام عربي RTL لإدارة طلبات التوظيف والتدريب والتجربة والتقييم وتحليل مواءمة المرشحين، مع تقييم مرحلي (HR / مختص / تنفيذي / مدير عام)، جدولة Microsoft Teams، عروض وظيفية، مباشرة عمل، وملفات موظفين.

## الإصلاحات الأخيرة (2026-09-17)
- إصلاح خطأ بناء `Expected '}' got '<eof>'` في `app/interviews/links/page.tsx` (كان ينقص قوس إغلاق).
- حذف المسارات المكررة `app/forms/joining/[candidate_id]` و `app/forms/offer/[candidate_id]` التي كانت تسبب تعارض مع `[candidateId]` على Linux.
- حذف `bun.lock` المتعارض مع `package-lock.json` وإبقاء npm كمدير حزم رسمي (متوافق مع `vercel.json` و GitHub Actions).
- إعادة تنسيق صفحات حرجة كانت مضغوطة في سطر واحد: `interviews/links`, `offers`, `employees`, `hiring-approvals`, `onboarding` لتصبح قابلة للصيانة.
- تحديث `lib/supabase.ts` لإزالة المفتاح المضمّن `sb_publishable_...` واستخدام متغيرات البيئة فقط مع fallback آمن أثناء البناء.
- تحديث `.env.example` بتوضيح المتغيرات المطلوبة.
- كتابة `supabase/schema.sql` كامل يغطي جميع الجداول المستخدمة فعليًا في الكود:
  `requests`, `request_requirements`, `candidates`, `candidate_requirement_scores`, `candidate_interviews`, `candidate_evaluation_links`, `candidate_hiring_approvals`, `employee_onboarding`, `candidate_onboarding`, `employee_records`, `employee_documents`, `hr_form_records`
  مع فهارس، RLS permissive للـ MVP، ودوال `get_candidate_public_form`, `save_candidate_public_form`, `delete_hr_request` و trigger لتحديث `updated_at`.
- البناء الآن ينجح: `npm run build` يعمل بدون أخطاء (تحذيرات ESLint فقط).

## التشغيل المحلي
```bash
npm install
npm run dev
```
ثم افتح `http://localhost:3000`.

## المزايا الحالية
- إنشاء طلب متعدد الخطوات: توظيف / تدريب / تجربة / تقييم مع قائمة مهن سعودية من API.
- متطلبات قابلة للتعديل مع أوزان مجموعها 100% وتحديد المتطلب الأساسي.
- مكتبة متطلبات هندسية: الرسم، Shop Drawings، BOQ، الحصر، المستخلصات، As-Built، Material Submittals، RFIs، AutoCAD، Excel، Revit/BIM، MS Project/Primavera والاعتمادات.
- إنشاء رابط خاص للمرشح وتقديم نموذج البيانات من الهاتف أو الكمبيوتر (عبر RPC آمن).
- تقييم مرحلي أربع مراحل بروابط مستقلة + مؤشرات تقدم.
- جدولة Microsoft Teams مع توليد رابط الاجتماع ورسالة دعوة وواتساب.
- اعتماد التعيين وقرار المدير العام ثم العروض الوظيفية بروابط توقيع.
- مباشرة العمل ونموذج A4 وطباعة PDF.
- ملفات الموظفين واستيراد Excel.
- تقارير PDF للطلب والمرشح والتقييم.

## Supabase
1. انسخ `.env.example` إلى `.env.local` ثم أضف:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `GEMINI_API_KEY` (اختياري)

2. نفّذ `supabase/schema.sql` في محرر SQL الخاص بـ Supabase لإنشاء جميع الجداول والدوال.

> ملاحظة: نسخة MVP تستخدم سياسات RLS مفتوحة (`for all using true`) لتسهيل التطوير. يجب تشديدها وإضافة مصادقة للموظفين قبل الإنتاج.

## النشر
المشروع جاهز للربط مع Vercel من مستودع GitHub `tempo033/HRanalysis`. أضف متغيرات Supabase في إعدادات Vercel قبل الاستخدام.
`vercel.json` يستخدم `npm install` و `npm run build`.

## فحص البناء
يوجد GitHub Actions workflow في `.github/workflows/ci.yml` لتشغيل `npm install` ثم `npm run build` على كل Push وPull Request إلى `main`.

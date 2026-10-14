-- Contributors Management Platform Database Export
-- Generated on 2026-10-14 12:52:50
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `app_notifications`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `app_notifications`;
CREATE TABLE `app_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `app_notifications_user_id_is_read_index` (`user_id`,`is_read`),
  CONSTRAINT `app_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `app_notifications`
INSERT INTO `app_notifications` (`id`, `user_id`, `title`, `message`, `type`, `action_url`, `is_read`, `created_at`, `updated_at`) VALUES
('1', '1', 'متقدم جديد سجل في المنصة', 'قام أنس طارق الصاوي بتقديم طلب جديد لوظيفة Full Stack Developer.', 'info', '/applicants', '0', '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('2', '1', 'تم ترقية متقدم لمقبول', 'تم إتمام قبول عمر عبد الله السعيد رسمياً كـ Full Stack Developer.', 'success', '/applicants', '1', '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('3', '3', 'مقابلة مجدولة قادمة', 'لديك مقابلة فنية قادمة مع خالد عبد الرحمن الدوسري.', 'warning', '/interviews', '0', '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('4', '2', 'متقدم جديد: ???? ???? ??????', 'تم استلام طلب تقديم جديد لوظيفة (Backend Developer (PHP/Laravel)) برقم APP-2026-0010.', 'info', '/applicants/10', '0', '2026-10-14 11:23:01', '2026-10-14 11:23:01'),
('5', '1', 'متقدم جديد: ???? ???? ??????', 'تم استلام طلب تقديم جديد لوظيفة (Backend Developer (PHP/Laravel)) برقم APP-2026-0010.', 'info', '/applicants/10', '0', '2026-10-14 11:23:01', '2026-10-14 11:23:01'),
('6', '1', 'رسالة بريد جديدة من: ??? ??? ???? ??????', 'وصل رد جديد بخصوص: ??: ???????! ?????? ????? ?????? ?? ?????? [APP-2026-0001]', 'info', '/emails', '0', '2026-10-14 12:13:02', '2026-10-14 12:13:02');

-- --------------------------------------------------------
-- Table structure for table `applicant_status_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `applicant_status_logs`;
CREATE TABLE `applicant_status_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `from_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by` bigint unsigned DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `applicant_status_logs_changed_by_foreign` (`changed_by`),
  KEY `applicant_status_logs_applicant_id_created_at_index` (`applicant_id`,`created_at`),
  CONSTRAINT `applicant_status_logs_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applicant_status_logs_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `applicant_status_logs`
INSERT INTO `applicant_status_logs` (`id`, `applicant_id`, `from_status`, `to_status`, `changed_by`, `notes`, `created_at`, `updated_at`) VALUES
('1', '1', NULL, 'applicant', '1', 'تم التقديم عبر النموذج الإلكتروني', '2026-09-21 10:37:40', '2026-10-14 10:37:40'),
('2', '1', 'applicant', 'participant', '1', 'اجتاز الفرز الأولي وسيرته الذاتية ممتازة', '2026-09-21 10:37:40', '2026-10-14 10:37:40'),
('3', '1', 'participant', 'probation', '1', 'نجح في المقابلة الفنية وبدأ فترة التجربة', '2026-09-21 10:37:40', '2026-10-14 10:37:40'),
('4', '1', 'probation', 'accepted', '1', 'أتم مهمة التجربة باقتدار وتم قبوله رسمياً!', '2026-09-21 10:37:40', '2026-10-14 10:37:40'),
('5', '2', NULL, 'applicant', '1', 'تقديم جديد', '2026-09-28 10:37:40', '2026-10-14 10:37:40'),
('6', '2', 'applicant', 'participant', '1', 'معرض الأعمال متميز جداً', '2026-09-28 10:37:40', '2026-10-14 10:37:40'),
('7', '2', 'participant', 'probation', '1', 'أحرزت 9/10 في المقابلة وبدأت فترة الاختبار', '2026-09-28 10:37:40', '2026-10-14 10:37:40'),
('8', '3', NULL, 'applicant', '1', 'تقديم عبر المنصة', '2026-10-04 10:37:40', '2026-10-14 10:37:40'),
('9', '3', 'applicant', 'participant', '1', 'تم الترقية لمشارك وتحديد موعد المقابلة', '2026-10-04 10:37:40', '2026-10-14 10:37:40'),
('10', '4', NULL, 'applicant', '1', 'تم استلام الطلب وبانتظار الفرز', '2026-10-12 10:37:40', '2026-10-14 10:37:41'),
('11', '5', NULL, 'applicant', '1', 'تقديم جديد', '2026-09-26 10:37:40', '2026-10-14 10:37:41'),
('12', '5', 'applicant', 'rejected', '1', 'اعتذار لعدم توافر الخبرة المطلوبة', '2026-09-26 10:37:40', '2026-10-14 10:37:41'),
('13', '6', NULL, 'applicant', '1', 'تقديم أولي', '2026-09-16 10:37:40', '2026-10-14 10:37:41'),
('14', '6', 'applicant', 'participant', '1', 'مقابلة أولية ممتازة', '2026-09-16 10:37:40', '2026-10-14 10:37:41'),
('15', '6', 'participant', 'probation', '1', 'اختبار عملي في إدارة نموذج مصغر', '2026-09-16 10:37:40', '2026-10-14 10:37:41'),
('16', '6', 'probation', 'accepted', '1', 'تم اعتماد القبول النهائي', '2026-09-16 10:37:40', '2026-10-14 10:37:41'),
('17', '7', NULL, 'applicant', '1', 'طلب مساهمة جديد', '2026-10-01 10:37:40', '2026-10-14 10:37:41'),
('18', '7', 'applicant', 'participant', '1', 'مؤهلات متميزة', '2026-10-01 10:37:40', '2026-10-14 10:37:41'),
('19', '7', 'participant', 'probation', '1', 'بدء مهمة إعداد خادم الاختبار', '2026-10-01 10:37:40', '2026-10-14 10:37:41'),
('20', '8', NULL, 'applicant', '1', 'تسجيل جديد', '2026-10-08 10:37:40', '2026-10-14 10:37:41'),
('21', '8', 'applicant', 'participant', '1', 'المحتوى المنشور مشجع جداً', '2026-10-08 10:37:40', '2026-10-14 10:37:41'),
('22', '9', NULL, 'applicant', '1', 'طلب مسجل جديد', '2026-10-14 10:37:40', '2026-10-14 10:37:41'),
('23', '10', NULL, 'applicant', NULL, 'تم استلام طلب التقديم عبر البوابة الإلكترونية.', '2026-10-14 11:23:01', '2026-10-14 11:23:01'),
('24', '11', NULL, 'applicant', '1', 'تم إنشاء الملف يدوياً من لوحة التحكم بواسطة أحمد منصور (Admin)', '2026-10-14 12:25:45', '2026-10-14 12:25:45');

-- --------------------------------------------------------
-- Table structure for table `applicants`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `applicants`;
CREATE TABLE `applicants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `application_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `national_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Egypt',
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `governorate` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `marital_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `experience_years` int NOT NULL DEFAULT '0',
  `education_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `portfolio_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `github_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resume_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_letter` text COLLATE utf8mb4_unicode_ci,
  `skills` json DEFAULT NULL,
  `social_links` json DEFAULT NULL,
  `portfolio_items` json DEFAULT NULL,
  `status` enum('applicant','participant','probation','accepted','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'applicant',
  `rating` decimal(3,1) DEFAULT '0.0',
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `internal_notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applicants_application_no_unique` (`application_no`),
  KEY `applicants_created_by_foreign` (`created_by`),
  KEY `applicants_status_index` (`status`),
  KEY `applicants_position_index` (`position`),
  KEY `applicants_email_index` (`email`),
  KEY `applicants_created_at_index` (`created_at`),
  CONSTRAINT `applicants_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `applicants`
INSERT INTO `applicants` (`id`, `application_no`, `full_name`, `email`, `phone`, `national_id`, `age`, `birth_date`, `gender`, `country`, `city`, `governorate`, `address`, `marital_status`, `position`, `experience_years`, `education_level`, `portfolio_url`, `linkedin_url`, `github_url`, `resume_path`, `cover_letter`, `skills`, `social_links`, `portfolio_items`, `status`, `rating`, `rejection_reason`, `internal_notes`, `created_by`, `created_at`, `updated_at`) VALUES
('1', 'APP-2026-0001', '??? ??? ???? ??????', 'omar@example.com', '01012345678', NULL, '28', NULL, '???', '???', 'القاهرة', '???????', '????? ???? ???? ??????? ???? ???????', '????', 'Senior Full-Stack Developer', '5', 'بكالوريوس حاسبات ومعلومات', 'https://github.com/omar-saeed', 'https://linkedin.com/in/omar-saeed', 'https://github.com/omar-saeed', '/storage/resumes/cv_1_1791980022.pdf', 'شغوف بالمساهمة وتطوير المنظومات مفتوحة المصدر والحلول التقنية المتكاملة.', '[\"Laravel\", \"React\", \"Tailwind CSS\", \"MySQL\", \"Docker\", \"REST API\"]', '[{\"id\": 1, \"url\": \"https://linkedin.com/in/omarabdullah\", \"label\": \"LinkedIn Profile\", \"platform\": \"linkedin\"}, {\"id\": 2, \"url\": \"https://github.com/omarabdullah\", \"label\": \"GitHub Repositories\", \"platform\": \"github\"}]', '[{\"id\": 1, \"url\": \"https://demo-ecommerce.example.com\", \"title\": \"???? ??????? ??????????? ????????\", \"image_url\": \"https://images.unsplash.com/photo-1557821552-17105176677c?w=600\", \"description\": \"???? ???????? ?????? ???? ?? Laravel ? React\"}]', 'accepted', '4.9', NULL, NULL, NULL, '2026-09-19 10:37:40', '2026-10-14 12:13:43'),
('2', 'APP-2026-0002', 'مريم يوسف الشناوي', 'mariam.shenawy@example.com', '+201022233344', NULL, NULL, NULL, NULL, 'مصر', 'الإسكندرية', NULL, NULL, NULL, 'UI/UX Product Designer', '4', 'بكالوريوس فنون تطبيقية', 'https://behance.net/mariam-ux', 'https://linkedin.com/in/mariam-shenawy', NULL, NULL, 'لدي خبرة عميقة في تصميم واجهات وتجارب المستخدم للمنصات الرقمية والتطبيقات الحديثة.', '[\"Figma\", \"Design Systems\", \"User Research\", \"Wireframing\", \"Prototyping\"]', NULL, NULL, 'probation', '4.6', NULL, NULL, NULL, '2026-09-26 10:37:40', '2026-10-14 10:37:40'),
('3', 'APP-2026-0003', 'خالد عبد الرحمن الدوسري', 'khaled.dossary@example.com', '+966501234567', NULL, NULL, NULL, NULL, 'السعودية', 'الرياض', NULL, NULL, NULL, 'Backend Developer (PHP/Laravel)', '3', 'بكالوريوس علوم حاسب', 'https://github.com/kdossary', NULL, 'https://github.com/kdossary', NULL, 'أرغب في الانضمام للمشروع والمساهمة في بناء بنية تحتية برمجية قوية.', '[\"PHP\", \"Laravel\", \"Redis\", \"PostgreSQL\", \"Microservices\"]', NULL, NULL, 'participant', '4.2', NULL, NULL, NULL, '2026-10-02 10:37:40', '2026-10-14 10:37:40'),
('4', 'APP-2026-0004', 'فاطمة الزهراء إبراهيم', 'fatima.zahra@example.com', '+201033344455', NULL, NULL, NULL, NULL, 'مصر', 'المنصورة', NULL, NULL, NULL, 'Frontend Developer (React/Tailwind)', '2', 'بكالوريوس هندسة حاسبات', 'https://fatimaz.dev', NULL, 'https://github.com/fatima-zahra', NULL, 'متحمسة للعمل على تطبيقات تفاعلية ذات أداء عالي وسرعة فائقة.', '[\"React\", \"TypeScript\", \"Tailwind CSS\", \"Redux Toolkit\", \"Next.js\"]', NULL, NULL, 'applicant', '3.8', NULL, NULL, NULL, '2026-10-10 10:37:40', '2026-10-14 10:37:41'),
('5', 'APP-2026-0005', 'محمود كمال النجار', 'mahmoud.najjar@example.com', '+201044455566', NULL, NULL, NULL, NULL, 'مصر', 'طنطا', NULL, NULL, NULL, 'Mobile Developer (Flutter)', '1', 'دبلوم تقني', NULL, NULL, NULL, NULL, 'حديث التخرج ومتحمس للتعلم والتدرب.', '[\"Flutter\", \"Dart\", \"Firebase\"]', NULL, NULL, 'rejected', '2.1', 'الخبرة العملية أقل من الحد الأدنى المطلوب للمشروع في المرحلة الراهنة.', NULL, NULL, '2026-09-24 10:37:40', '2026-10-14 10:37:41'),
('6', 'APP-2026-0006', 'هدى عبد المنعم الباز', 'huda.elbaz@example.com', '+201055566677', NULL, NULL, NULL, NULL, 'مصر', 'الجيزة', NULL, NULL, NULL, 'Technical Project Manager', '6', 'ماجستير إدارة مشاريع تقنية', NULL, 'https://linkedin.com/in/huda-elbaz', NULL, NULL, 'خبرة قيادية في توجيه الفرق البرمجية وتحقيق الأهداف في المواعيد المحددة.', '[\"Scrum\", \"Agile\", \"Jira\", \"Sprint Planning\", \"Risk Management\"]', NULL, NULL, 'accepted', '4.8', NULL, NULL, NULL, '2026-09-14 10:37:40', '2026-10-14 10:37:41'),
('7', 'APP-2026-0007', 'ياسين حسن العوضي', 'yassin.awadi@example.com', '+971501239876', NULL, NULL, NULL, NULL, 'الإمارات', 'دبي', NULL, NULL, NULL, 'DevOps & Cloud Engineer', '4', 'بكالوريوس هندسة شبكات', NULL, NULL, 'https://github.com/yassin-ops', NULL, 'متخصص في بناء خطوط النشر الآلي وتأمين الخوادم السحابية.', '[\"AWS\", \"Kubernetes\", \"CI/CD\", \"Terraform\", \"Linux\"]', NULL, NULL, 'probation', '4.5', NULL, NULL, NULL, '2026-09-29 10:37:40', '2026-10-14 10:37:41'),
('8', 'APP-2026-0008', 'سلمى ناصر الزهراني', 'salma.zahrani@example.com', '+966559871234', NULL, NULL, NULL, NULL, 'السعودية', 'جدة', NULL, NULL, NULL, 'Content & Community Contributor', '3', 'بكالوريوس إعلام واتصال', 'https://medium.com/@salma_writer', NULL, NULL, NULL, 'لدي كتابات تقنية وشغف ببناء المحتوى العربي المتخصص.', '[\"Technical Writing\", \"Copywriting\", \"SEO\", \"Community Engagement\"]', NULL, NULL, 'participant', '4.0', NULL, NULL, NULL, '2026-10-06 10:37:40', '2026-10-14 10:37:41'),
('9', 'APP-2026-0009', 'أنس طارق الصاوي', 'anas.sawy@example.com', '+201066677788', NULL, NULL, NULL, NULL, 'مصر', 'أسيوط', NULL, NULL, NULL, 'Full Stack Developer (Laravel & React)', '2', 'بكالوريوس نظم معلومات', NULL, NULL, 'https://github.com/anas-sawy', NULL, 'أرغب في صقل خبراتي والمساهمة مع فريق عمل محترف.', '[\"Laravel\", \"React\", \"Livewire\", \"MySQL\"]', NULL, NULL, 'applicant', '3.5', NULL, NULL, NULL, '2026-10-12 10:37:40', '2026-10-14 10:37:41'),
('10', 'APP-2026-0010', '???? ???? ??????', 'ziad.kadi@example.com', '+201099887766', NULL, NULL, NULL, NULL, '???', '????', NULL, NULL, NULL, 'Backend Developer (PHP/Laravel)', '3', '????????? ??????', NULL, NULL, NULL, NULL, '????? ???????? ?? ????? ?? ???????', '[\"Laravel\", \"MySQL\", \"Redis\"]', NULL, NULL, 'applicant', '0.0', NULL, NULL, NULL, '2026-10-14 11:23:01', '2026-10-14 11:23:01'),
('11', 'APP-2026-0011', 'إلياس سلطان', 'eliassultan778@gmail.com', '967778092684', NULL, NULL, NULL, NULL, 'مصر', NULL, NULL, NULL, NULL, 'Full Stack Developer (Laravel & React)', '2', 'بكالوريوس', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'applicant', '0.0', NULL, 'ارسال ترحيب مع طلب الأوقات المتاحة للاتصال في الأسبوع القادم', '1', '2026-10-14 12:25:44', '2026-10-14 12:25:44');

-- --------------------------------------------------------
-- Table structure for table `cache`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `cache_locks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `email_logs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned DEFAULT NULL,
  `sender_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('sent','received') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `status` enum('sent','delivered','failed','received') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `template_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `email_logs_sent_by_foreign` (`sent_by`),
  KEY `email_logs_applicant_id_index` (`applicant_id`),
  KEY `email_logs_recipient_email_index` (`recipient_email`),
  KEY `email_logs_created_at_index` (`created_at`),
  CONSTRAINT `email_logs_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `email_logs_sent_by_foreign` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `email_logs`
INSERT INTO `email_logs` (`id`, `applicant_id`, `sender_email`, `recipient_email`, `subject`, `body`, `type`, `status`, `template_name`, `sent_by`, `created_at`, `updated_at`) VALUES
('1', '1', 'recruitment@contributors.app', 'omar.saeed@example.com', 'دعوة لحضور المقابلة الشخصية - Full Stack Developer (Laravel & React)', 'عزيزي عمر عبد الله السعيد، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:40', '2026-10-14 10:37:40'),
('2', '1', 'recruitment@contributors.app', 'omar.saeed@example.com', 'تهانينا! تم قبولك رسمياً في المنصة - APP-2026-0001', 'مرحباً عمر عبد الله السعيد، يسعدنا إعلامك باجتيازك لكافة المراحل بنجاح وقبولك رسمياً معنا في المشروع. سيتم تزويدك بكافة تفاصيل البدء قريباً.', 'sent', 'delivered', 'acceptance_letter', '1', '2026-10-11 10:37:40', '2026-10-14 10:37:40'),
('3', '1', 'omar.saeed@example.com', 'recruitment@contributors.app', 'رد: تهانينا! تم قبولك رسمياً في المنصة', 'أشكركم جزيل الشكر على هذه الثقة الغالية، ومتحمس جداً لبدء العمل والمساهمة مع الفريق الموقر.', 'received', 'received', NULL, NULL, '2026-10-12 10:37:40', '2026-10-14 10:37:40'),
('4', '2', 'recruitment@contributors.app', 'mariam.shenawy@example.com', 'دعوة لحضور المقابلة الشخصية - UI/UX Product Designer', 'عزيزي مريم يوسف الشناوي، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:40', '2026-10-14 10:37:40'),
('5', '3', 'recruitment@contributors.app', 'khaled.dossary@example.com', 'دعوة لحضور المقابلة الشخصية - Backend Developer (PHP/Laravel)', 'عزيزي خالد عبد الرحمن الدوسري، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:41', '2026-10-14 10:37:41'),
('6', '6', 'recruitment@contributors.app', 'huda.elbaz@example.com', 'دعوة لحضور المقابلة الشخصية - Technical Project Manager', 'عزيزي هدى عبد المنعم الباز، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:41', '2026-10-14 10:37:41'),
('7', '6', 'recruitment@contributors.app', 'huda.elbaz@example.com', 'تهانينا! تم قبولك رسمياً في المنصة - APP-2026-0006', 'مرحباً هدى عبد المنعم الباز، يسعدنا إعلامك باجتيازك لكافة المراحل بنجاح وقبولك رسمياً معنا في المشروع. سيتم تزويدك بكافة تفاصيل البدء قريباً.', 'sent', 'delivered', 'acceptance_letter', '1', '2026-10-11 10:37:41', '2026-10-14 10:37:41'),
('8', '6', 'huda.elbaz@example.com', 'recruitment@contributors.app', 'رد: تهانينا! تم قبولك رسمياً في المنصة', 'أشكركم جزيل الشكر على هذه الثقة الغالية، ومتحمس جداً لبدء العمل والمساهمة مع الفريق الموقر.', 'received', 'received', NULL, NULL, '2026-10-12 10:37:41', '2026-10-14 10:37:41'),
('9', '7', 'recruitment@contributors.app', 'yassin.awadi@example.com', 'دعوة لحضور المقابلة الشخصية - DevOps & Cloud Engineer', 'عزيزي ياسين حسن العوضي، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:41', '2026-10-14 10:37:41'),
('10', '8', 'recruitment@contributors.app', 'salma.zahrani@example.com', 'دعوة لحضور المقابلة الشخصية - Content & Community Contributor', 'عزيزي سلمى ناصر الزهراني، يسعدنا دعوتك لإجراء المقابلة الشخصية عبر الرابط التالي: https://meet.google.com/xyz', 'sent', 'delivered', 'interview_invitation', '2', '2026-10-03 10:37:41', '2026-10-14 10:37:41'),
('11', '10', 'recruitment@contributors.app', 'ziad.kadi@example.com', 'تم استلام طلب التقديم بنجاح [APP-2026-0010]', 'عزيزي/عزيزتي ???? ???? ??????،\n\nنشكرك على رغبتك في الانضمام والمساهمة معنا كـ (Backend Developer (PHP/Laravel)).\nرقم طلبك هو: APP-2026-0010.\nسيقوم فريق الفرز والتطوير بمراجعة ملفك والتواصل معك عبر البريد الإلكتروني في حال التأهل للمراحل القادمة.\n\nمع أطيب التمنيات،\nفريق العمل', 'sent', 'delivered', 'application_received', NULL, '2026-10-14 11:23:01', '2026-10-14 11:23:01'),
('12', '1', 'recruitment@contributors.app', 'omar@example.com', '???????! ?????? ????? ?????? ?? ?????? [APP-2026-0001]', '?????? ???? ?????? ?????? ??????? ???????? ????? ??????? ????? ?? ?????? ?? Senior Full-Stack Developer.', 'sent', 'delivered', 'custom', '1', '2026-10-14 12:13:02', '2026-10-14 12:13:02'),
('13', '1', 'omar@example.com', 'recruitment@contributors.app', '??: ???????! ?????? ????? ?????? ?? ?????? [APP-2026-0001]', '????? ?????? ??? ??????? ??????? ???? ???????? ?????? ?????? ??? ????? ???? ????? ?????.', 'received', 'received', 'applicant_reply', NULL, '2026-10-14 12:13:02', '2026-10-14 12:13:02'),
('14', NULL, 'mawthiqtr@gmail.com', 'mawthiqtr@gmail.com', 'Test Subject', 'This is a test body from contributors app.\n\n[خطأ الإرسال]: Failed to authenticate on SMTP server with username \"mawthiqtr@gmail.com\" using the following authenticators: \"LOGIN\", \"PLAIN\", \"XOAUTH2\". Authenticator \"LOGIN\" returned \"Expected response code \"235\" but got code \"534\", with message \"534-5.7.9 Application-specific password required. For more information, go to\r\n534 5.7.9  https://support.google.com/mail/?p=InvalidSecondFactor 5b1f17b1804b1-4a18bf35930sm435858135e9.13 - gsmtp\".\". Authenticator \"PLAIN\" returned \"Expected response code \"235\" but got empty code.\". Authenticator \"XOAUTH2\" returned \"Expected response code \"235\" but got empty code.\".', 'sent', 'failed', 'custom', NULL, '2026-10-14 12:50:32', '2026-10-14 12:50:35');

-- --------------------------------------------------------
-- Table structure for table `failed_jobs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `interviews`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `interviews`;
CREATE TABLE `interviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `interview_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `meeting_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interviewer_id` bigint unsigned DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled','rescheduled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `technical_score` int DEFAULT NULL,
  `communication_score` int DEFAULT NULL,
  `commitment_score` int DEFAULT NULL,
  `overall_score` decimal(4,2) DEFAULT NULL,
  `recommendation` enum('strong_hire','hire','under_consideration','reject') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `questions` json DEFAULT NULL,
  `conducted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `interviews_interviewer_id_foreign` (`interviewer_id`),
  KEY `interviews_applicant_id_index` (`applicant_id`),
  KEY `interviews_status_index` (`status`),
  KEY `interviews_scheduled_at_index` (`scheduled_at`),
  CONSTRAINT `interviews_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interviews_interviewer_id_foreign` FOREIGN KEY (`interviewer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `interviews`
INSERT INTO `interviews` (`id`, `applicant_id`, `scheduled_at`, `interview_type`, `meeting_link`, `location`, `interviewer_id`, `status`, `technical_score`, `communication_score`, `commitment_score`, `overall_score`, `recommendation`, `feedback`, `questions`, `conducted_at`, `created_at`, `updated_at`) VALUES
('1', '1', '2026-10-04 10:37:40', 'online', 'https://meet.google.com/xyz-c4ca423', NULL, '3', 'completed', '8', '10', '10', '9.50', 'hire', 'مرشح ذو إمكانيات قوية، لديه فهم عميق لأساسيات المعمارية والعمل الجماعي.', '[{\"id\": 1, \"notes\": \"?????? ?????? ?????? ????? ????????? ???? Transactions\", \"score\": 9, \"category\": \"technical\", \"question\": \"?????? ?? Laravel ? Eloquent ORM ????????\", \"max_score\": 10}, {\"id\": 2, \"notes\": \"???? ?????? ?? ????? ?????? ? Custom Hooks\", \"score\": 9, \"category\": \"technical\", \"question\": \"???? ?????? React ????? ?? Tailwind CSS\", \"max_score\": 10}, {\"id\": 3, \"notes\": \"????? ???? ???? ?????\", \"score\": 9, \"category\": \"communication\", \"question\": \"?????? ????? ??????? ??? ???????? ???????\", \"max_score\": 10}]', '2026-10-04 10:37:40', '2026-10-14 10:37:40', '2026-10-14 12:12:51'),
('2', '2', '2026-10-04 10:37:40', 'online', 'https://meet.google.com/xyz-c81e728', NULL, '3', 'completed', '10', '8', '7', '9.50', 'hire', 'مرشح ذو إمكانيات قوية، لديه فهم عميق لأساسيات المعمارية والعمل الجماعي.', NULL, '2026-10-04 10:37:40', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('3', '3', '2026-10-16 10:37:41', 'online', 'https://meet.google.com/xyz-eccbc87', NULL, '3', 'scheduled', NULL, NULL, NULL, NULL, NULL, 'تم تحديد المقابلة وإرسال رابط جوجل ميت للمتقدم.', NULL, NULL, '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('4', '6', '2026-10-04 10:37:41', 'online', 'https://meet.google.com/xyz-1679091', NULL, '3', 'completed', '10', '8', '7', '9.30', 'hire', 'مرشح ذو إمكانيات قوية، لديه فهم عميق لأساسيات المعمارية والعمل الجماعي.', NULL, '2026-10-04 10:37:41', '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('5', '7', '2026-10-04 10:37:41', 'online', 'https://meet.google.com/xyz-8f14e45', NULL, '3', 'completed', '9', '8', '10', '9.30', 'hire', 'مرشح ذو إمكانيات قوية، لديه فهم عميق لأساسيات المعمارية والعمل الجماعي.', NULL, '2026-10-04 10:37:41', '2026-10-14 10:37:41', '2026-10-14 10:37:41'),
('6', '8', '2026-10-16 10:37:41', 'online', 'https://meet.google.com/xyz-c9f0f89', NULL, '3', 'scheduled', NULL, NULL, NULL, NULL, NULL, 'تم تحديد المقابلة وإرسال رابط جوجل ميت للمتقدم.', NULL, NULL, '2026-10-14 10:37:41', '2026-10-14 10:37:41');

-- --------------------------------------------------------
-- Table structure for table `job_batches`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `jobs`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `migrations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migrations`
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
('1', '0001_01_01_000000_create_users_table', '1'),
('2', '0001_01_01_000001_create_cache_table', '1'),
('3', '0001_01_01_000002_create_jobs_table', '1'),
('4', '2026_10_14_000001_create_roles_and_permissions_tables', '1'),
('5', '2026_10_14_000002_create_applicants_tables', '1'),
('6', '2026_10_14_000003_create_interviews_table', '1'),
('7', '2026_10_14_000004_create_email_logs_table', '1'),
('8', '2026_10_14_000005_create_settings_table', '1'),
('9', '2026_10_14_000006_create_app_notifications_table', '1'),
('10', '2026_10_14_103225_create_personal_access_tokens_table', '1'),
('11', '2026_10_14_114030_add_detailed_fields_to_applicants_and_interviews', '2');

-- --------------------------------------------------------
-- Table structure for table `password_reset_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `display_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `permissions`
INSERT INTO `permissions` (`id`, `name`, `category`, `display_name_ar`, `display_name_en`, `created_at`, `updated_at`) VALUES
('1', 'view_applicants', 'applicants', 'عرض المتقدمين', 'View Applicants', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('2', 'create_applicants', 'applicants', 'إضافة متقدم جديد', 'Create Applicants', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('3', 'edit_applicants', 'applicants', 'تعديل بيانات المتقدم', 'Edit Applicants', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('4', 'delete_applicants', 'applicants', 'حذف متقدم', 'Delete Applicants', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('5', 'promote_applicants', 'applicants', 'ترقية وتغيير حالة المتقدم', 'Change Status & Promote', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('6', 'schedule_interviews', 'interviews', 'جدولة المقابلات', 'Schedule Interviews', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('7', 'record_interview_results', 'interviews', 'تسجيل نتائج وتقييم المقابلة', 'Record Interview Results', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('8', 'delete_interviews', 'interviews', 'إلغاء وحذف المقابلة', 'Delete Interviews', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('9', 'view_reports', 'reports', 'عرض التقارير والإحصائيات', 'View Reports & Statistics', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('10', 'export_reports', 'reports', 'تصدير التقارير', 'Export Reports', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('11', 'send_emails', 'emails', 'إرسال وتصفح البريد', 'Send & View Emails', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('12', 'manage_users', 'users', 'إدارة المستخدمين والصلاحيات', 'Manage Users & Permissions', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('13', 'manage_settings', 'settings', 'إدارة إعدادات النظام', 'Manage System Settings', '2026-10-14 10:37:37', '2026-10-14 10:37:37');

-- --------------------------------------------------------
-- Table structure for table `personal_access_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `personal_access_tokens`
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
('1', 'App\\Models\\User', '1', 'auth_token', '52561e0d53e701e7d3380d8ac643689acd6f73d7ccb248e6805d08012c2518de', '[\"*\"]', '2026-10-14 11:24:01', NULL, '2026-10-14 11:22:43', '2026-10-14 11:24:01'),
('2', 'App\\Models\\User', '1', 'auth_token', '1d1e1c0aff1054c3c148a28a3c5c2682d5d69f833d7d72c5233cfc9c7be87138', '[\"*\"]', '2026-10-14 12:43:18', NULL, '2026-10-14 11:27:03', '2026-10-14 12:43:18'),
('3', 'App\\Models\\User', '1', 'auth_token', 'cdce346ab7b54db1f8e8ceeedd7af406831075f0d67cc2fe6cbd139eae0e5c23', '[\"*\"]', '2026-10-14 12:12:18', NULL, '2026-10-14 12:12:18', '2026-10-14 12:12:18'),
('4', 'App\\Models\\User', '1', 'auth_token', '47eb6c9ee0ad952d2537009da91eeccedd4c278da75c7ca1deba1e30d9e30c9a', '[\"*\"]', '2026-10-14 12:12:42', NULL, '2026-10-14 12:12:42', '2026-10-14 12:12:42'),
('5', 'App\\Models\\User', '1', 'auth_token', 'd4f0dc9a9fc72b4518637a60842dd73dd0194c671edd5683eec177cfa94f6fb5', '[\"*\"]', '2026-10-14 12:12:50', NULL, '2026-10-14 12:12:50', '2026-10-14 12:12:50'),
('6', 'App\\Models\\User', '1', 'auth_token', '4bf9fab39811365762dc2276f19d25e6b141dc3a62aa7b8d8cf22948894f08d5', '[\"*\"]', '2026-10-14 12:13:02', NULL, '2026-10-14 12:13:02', '2026-10-14 12:13:02'),
('7', 'App\\Models\\User', '1', 'auth_token', 'a59680292bfcd2697cc0c4e04f893dfef68c1f6bf29ea2a38a3e740fe9c979a7', '[\"*\"]', '2026-10-14 12:13:33', NULL, '2026-10-14 12:13:33', '2026-10-14 12:13:33'),
('8', 'App\\Models\\User', '1', 'auth_token', '1d7bdaa6e70e0228246e63050823f1ee6a8dea3129a5952ad6931ab0621a5628', '[\"*\"]', '2026-10-14 12:13:42', NULL, '2026-10-14 12:13:42', '2026-10-14 12:13:42'),
('9', 'App\\Models\\User', '1', 'auth_token', 'dd380a605c8bbbd688a1d0fa9b80843731f86ab9b44e7d6b24047393bff874b5', '[\"*\"]', '2026-10-14 12:49:26', NULL, '2026-10-14 12:49:26', '2026-10-14 12:49:26');

-- --------------------------------------------------------
-- Table structure for table `role_has_permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `role_has_permissions`;
CREATE TABLE `role_has_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `role_has_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `role_has_permissions`
INSERT INTO `role_has_permissions` (`role_id`, `permission_id`) VALUES
('1', '1'),
('2', '1'),
('3', '1'),
('4', '1'),
('1', '2'),
('2', '2'),
('1', '3'),
('2', '3'),
('1', '4'),
('1', '5'),
('2', '5'),
('1', '6'),
('2', '6'),
('1', '7'),
('2', '7'),
('3', '7'),
('1', '8'),
('1', '9'),
('2', '9'),
('4', '9'),
('1', '10'),
('2', '10'),
('1', '11'),
('2', '11'),
('1', '12'),
('1', '13');

-- --------------------------------------------------------
-- Table structure for table `roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `roles`
INSERT INTO `roles` (`id`, `name`, `display_name_ar`, `display_name_en`, `description`, `created_at`, `updated_at`) VALUES
('1', 'super_admin', 'مدير النظام (Super Admin)', 'Super Administrator', 'كامل الصلاحيات والتحكم في كل مفاصل النظام والمستخدمين والإعدادات.', '2026-10-14 10:37:37', '2026-10-14 10:37:37'),
('2', 'hr', 'مسؤول توظيف (HR Manager)', 'HR / Recruiter', 'إدارة المتقدمين، ترقية الحالات، جدولة المقابلات وإرسال الإيميلات وعرض التقارير.', '2026-10-14 10:37:38', '2026-10-14 10:37:38'),
('3', 'interviewer', 'محكّم ومسؤول مقابلات (Interviewer)', 'Interviewer / Evaluator', 'عرض المتقدمين المحالين للمقابلة وتسجيل نتائج التقييم والملاحظات الفنية.', '2026-10-14 10:37:38', '2026-10-14 10:37:38'),
('4', 'viewer', 'مشاهد (Viewer)', 'Viewer (Read-only)', 'صلاحية للاطلاع والمشاهدة فقط بدون تعديل.', '2026-10-14 10:37:38', '2026-10-14 10:37:38');

-- --------------------------------------------------------
-- Table structure for table `sessions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `group` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `settings`
INSERT INTO `settings` (`id`, `key`, `value`, `type`, `group`, `created_at`, `updated_at`) VALUES
('1', 'app_name', 'منصة إدارة المتقدمين والمساهمين', 'string', 'general', '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('2', 'app_name_en', 'Contributors & Applicants Management', 'string', 'general', '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('3', 'organization_name', 'منظومة التطوير والمساهمة الرقمية', 'string', 'general', '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('4', 'contact_email', 'recruitment@contributors.app', 'string', 'general', '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('5', 'contact_phone', '+20 100 000 0000', 'string', 'general', '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('6', 'default_language', 'ar', 'string', 'general', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('7', 'applications_open', '1', 'boolean', 'recruitment', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('8', 'application_deadline', '2026-12-14', 'string', 'recruitment', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('9', 'allowed_positions', '[\"Full Stack Developer (Laravel & React)\",\"Backend Developer (PHP\\/Laravel)\",\"Frontend Developer (React\\/Tailwind)\",\"UI\\/UX Product Designer\",\"Mobile Developer (Flutter)\",\"DevOps & Cloud Engineer\",\"Technical Project Manager\",\"Content & Community Contributor\"]', 'json', 'recruitment', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('10', 'mail_mailer', 'smtp', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 10:37:40'),
('11', 'mail_host', 'smtp.gmail.com', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('12', 'mail_port', '587', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('13', 'mail_username', 'mawthiqtr@gmail.com', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('14', 'mail_password', 'Shaza@2020', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('15', 'mail_from_address', 'mawthiqtr@gmail.com', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('16', 'mail_from_name', 'منصة إدارة المتقدمين والمساهمين', 'string', 'email', '2026-10-14 10:37:40', '2026-10-14 12:47:57'),
('17', 'mail_encryption', 'tls', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57'),
('18', 'imap_host', 'imap.gmail.com', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57'),
('19', 'imap_port', '993', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57'),
('20', 'imap_encryption', 'ssl', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57'),
('21', 'imap_username', 'mawthiqtr@gmail.com', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57'),
('22', 'imap_password', 'Shaza@2020', 'string', 'email', '2026-10-14 12:47:57', '2026-10-14 12:47:57');

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` bigint unsigned DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ar',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_foreign` (`role_id`),
  CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `role_id`, `phone`, `avatar`, `status`, `locale`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
('1', 'أحمد منصور (Admin)', 'admin@contributors.app', '1', '+201001234567', NULL, 'active', 'ar', NULL, '$2y$12$DA0xS5l6xmj6rDiTa0n2AO5IfZk1giKoGj.sPCymm.gJvSJAXwOim', NULL, '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('2', 'سارة السيد (HR)', 'hr@contributors.app', '2', '+201019876543', NULL, 'active', 'ar', NULL, '$2y$12$5rPViUdgYyh5Zg1Zv7WpDu90/SIXbsRZE1pej3jRw.2sajJZLufiC', NULL, '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('3', 'طارق مصطفى (Tech Lead)', 'interviewer@contributors.app', '3', '+201123456789', NULL, 'active', 'ar', NULL, '$2y$12$9G/XgOa2R1rulA8g8m952ODzfRIWYvN6Xs4A1gA/DRVo5Zn8SzcyO', NULL, '2026-10-14 10:37:39', '2026-10-14 10:37:39'),
('4', 'نور خالد (Auditor)', 'viewer@contributors.app', '4', '+201234567890', NULL, 'active', 'ar', NULL, '$2y$12$u9.jOFnj/Ow81byKIF7//.Oxpbg5Mi1QGmA4JcYqXCXqt0nyvSEvu', NULL, '2026-10-14 10:37:39', '2026-10-14 10:37:39');

SET FOREIGN_KEY_CHECKS=1;
COMMIT;

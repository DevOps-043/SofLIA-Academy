import type { TFunction } from 'i18next';
import { Activity, BookOpen, ChevronDown, FileText } from 'lucide-react';
import { ActivityTypeBadge, QuizStatusBadges } from './ActivityCardHeaderBadges';
import { CompletionBadge } from './CompletionBadge';
import type { LearnActivity, LessonQuizStatusItem } from '../../types';
import styles from '../../ActivitiesExperience.module.css';

interface ActivityCardHeaderProps {
  activity: LearnActivity;
  isCollapsed: boolean;
  isQuiz: boolean;
  isSofliaActivity: boolean;
  onToggle: (activityId: string) => void;
  quizInfo?: LessonQuizStatusItem;
  t: TFunction<'learn'>;
}

export function ActivityCardHeader({
  activity,
  isCollapsed,
  isQuiz,
  isSofliaActivity,
  onToggle,
  quizInfo,
  t
}: ActivityCardHeaderProps) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onToggle(activity.activity_id);
      }}
      className={styles.cardButton}
    >
      <ActivityIcon activity={activity} isQuiz={isQuiz} isSofliaActivity={isSofliaActivity} />
      <div className={styles.cardCopy}>
        <div className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>
            {activity.activity_title}
          </span>
          {activity.is_required && <RequiredBadge label={t('activities.required')} />}
          <ActivityTypeBadge activity={activity} isSofliaActivity={isSofliaActivity} t={t} />
          <QuizStatusBadges activity={activity} quizInfo={quizInfo} t={t} />
          <CompletionBadge t={t} activity={activity} />
        </div>
      </div>
      <ChevronDown className={`${styles.chevron} ${!isCollapsed ? styles.chevronOpen : ''}`} />
    </button>
  );
}

function ActivityIcon({
  activity,
  isQuiz,
  isSofliaActivity
}: Pick<ActivityCardHeaderProps, 'activity' | 'isQuiz' | 'isSofliaActivity'>) {
  const iconClass = 'h-4 w-4';

  return (
    <div
      className={styles.cardIcon}
    >
      {isSofliaActivity ? (
        <img src="/assets/soflia-avatar/badge-idle.webp" alt="SofLIA" className="h-full w-full object-contain" />
      ) : isQuiz ? (
        <FileText className={iconClass} />
      ) : activity.activity_type === 'reading' ? (
        <BookOpen className={iconClass} />
      ) : (
        <Activity className={iconClass} />
      )}
    </div>
  );
}

function RequiredBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-100/70 px-2 py-1 text-[10px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      {label}
    </span>
  );
}

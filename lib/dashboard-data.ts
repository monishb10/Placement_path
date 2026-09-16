import { dateFromKey, localDate, taskIds, type StudyState, type Session } from './study-data';
export function hasStudyActivity(session?: Session) {
    return !!session && (session.checks.length > 0 || session.steps.length > 0 ||
        !!session.code.trim() || !!session.explanation.trim() || session.attempted > 0 || session.reported);
}
export function dashboardStats(state: StudyState, today: string, days = 7, codingDays: string[] = []) {
    const sessions = Object.values(state.sessions).filter(s => s.date <= today && hasStudyActivity(s));
    const codingRecords = [...sessions, ...Object.values(state.practice ?? {}).filter(s => s.date <= today && hasStudyActivity(s))];
    const dates=new Set([...codingRecords.map(s=>s.date),...codingDays].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=today));
    const activity = today ? Array.from({ length: days }, (_, i) => {
        const date = dateFromKey(today);
        date.setDate(date.getDate() - days + 1 + i);
        const key = localDate(date), session = state.sessions[key];
        return {
            date: key,
            label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
            fullLabel: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
            tasks: taskIds.filter(id => session?.checks.includes(id)).length,
            active: dates.has(key),
        };
    }) : [];
    let streak = 0;
    if (today) {
        const cursor = dateFromKey(today);
        if (!dates.has(today))
            cursor.setDate(cursor.getDate() - 1);
        while (dates.has(localDate(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
    }
    let bestStreak=0,run=0,previous='';
    for(const key of [...dates].sort()){
        const cursor=dateFromKey(key);cursor.setDate(cursor.getDate()-1);
        run=localDate(cursor)===previous?run+1:1;bestStreak=Math.max(bestStreak,run);previous=key;
    }
    // Sort explicitly: persisted object insertion order is not necessarily chronological.
    const revision = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))
        .filter(s => s.notes.trim() || s.revision.trim()).slice(0, 3);
    return {
        activity, streak, bestStreak, studiedToday:dates.has(today), revision,
        activeDays: activity.filter(d => d.active).length,
        tasks: activity.reduce((n, d) => n + d.tasks, 0),
        solved: codingRecords.reduce((n, s) => n + s.solved, 0),
        independent: codingRecords.reduce((n, s) => n + s.independent, 0),
        attempted: codingRecords.reduce((n, s) => n + s.attempted, 0),
    };
}

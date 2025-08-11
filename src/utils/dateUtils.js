export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export const getDayOfWeek = (year, month, day) => new Date(year, month, day).getDay() + 1;

export const getDayName = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
};

export const isWeekend = (dayOfWeek) => dayOfWeek === 1 || dayOfWeek === 7;

export const isTaskApplicable = (task, day, month, year) => {
    const dayOfWeek = getDayOfWeek(year, month, day);

    const taskStartDate = new Date(task.startDate);
    const currentDate = new Date(year, month, day);
    if (currentDate < new Date(taskStartDate.getFullYear(), taskStartDate.getMonth(), taskStartDate.getDate())) {
        return false;
    }

    let isScheduledDay = false;
    if (task.isDaily) {
        isScheduledDay = !isWeekend(dayOfWeek);
    } else {
        isScheduledDay = (task.schedule && task.schedule.includes(dayOfWeek));
    }
    let isWithinRepetitionPeriod = true;
    if (task.repetitionType === 'limited_weeks' && task.repetitionWeeks && task.startDate) {
        const endDate = new Date(taskStartDate);
        endDate.setDate(taskStartDate.getDate() + (task.repetitionWeeks * 7) -1);

        const currentDayOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const startDayOnly = new Date(taskStartDate.getFullYear(), taskStartDate.getMonth(), taskStartDate.getDate());
        const endDayOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        isWithinRepetitionPeriod = currentDayOnly >= startDayOnly && currentDayOnly <= endDayOnly;
    }
    return isScheduledDay && isWithinRepetitionPeriod;
};
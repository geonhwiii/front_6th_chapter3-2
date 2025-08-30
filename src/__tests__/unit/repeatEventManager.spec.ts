import { describe, test, expect } from 'vitest';

import { Event, EventForm } from '../../types';
import {
  createRepeatEvents,
  updateSingleRepeatEvent,
  deleteSingleRepeatEvent,
  markRepeatEvents,
} from '../../utils/dateUtils';

describe('반복 일정 분할 생성', () => {
  test('반복 설정이 있는 이벤트는 여러 개의 개별 이벤트로 생성된다', () => {
    // Given: 매월 반복 설정이 있는 EventForm
    const baseEventForm: EventForm = {
      title: '매월 회의',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '매월 정기 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-04-15',
      },
      notificationTime: 10,
    };

    // When: createRepeatEvents 함수 호출
    const events = createRepeatEvents(baseEventForm);

    // Then: 반복 날짜별로 개별 Event 객체들이 생성됨 (각각 고유 ID 포함)
    expect(events).toHaveLength(4); // 1월, 2월, 3월, 4월
    expect(events[0].date).toBe('2024-01-15');
    expect(events[1].date).toBe('2024-02-15');
    expect(events[2].date).toBe('2024-03-15');
    expect(events[3].date).toBe('2024-04-15');

    // 모든 이벤트는 고유 ID를 가져야 함
    const ids = events.map((event) => event.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(events.length);

    // 모든 이벤트는 동일한 기본 정보를 가져야 함
    events.forEach((event) => {
      expect(event.title).toBe(baseEventForm.title);
      expect(event.startTime).toBe(baseEventForm.startTime);
      expect(event.endTime).toBe(baseEventForm.endTime);
      expect(event.description).toBe(baseEventForm.description);
      expect(event.location).toBe(baseEventForm.location);
      expect(event.category).toBe(baseEventForm.category);
      expect(event.notificationTime).toBe(baseEventForm.notificationTime);
    });
  });

  test('반복 없음 설정 이벤트는 단일 이벤트로만 생성된다', () => {
    // Given: repeat.type이 'none'인 EventForm
    const baseEventForm: EventForm = {
      title: '단일 일정',
      date: '2024-01-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '한번만 실행되는 일정',
      location: '카페',
      category: '개인',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 5,
    };

    // When: createRepeatEvents 함수 호출
    const events = createRepeatEvents(baseEventForm);

    // Then: 원본 이벤트 하나만 반환됨
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2024-01-15');
    expect(events[0].title).toBe(baseEventForm.title);
    expect(events[0].repeat.type).toBe('none');
  });
});

describe('반복 일정 개별 처리', () => {
  test('반복 일정 중 하나를 수정하면 단일 일정으로 변경된다', () => {
    // Given: 반복으로 생성된 여러 이벤트 중 특정 이벤트 ID
    const existingEvents: Event[] = [
      {
        id: 'repeat-1',
        title: '매주 운동',
        date: '2024-01-01',
        startTime: '07:00',
        endTime: '08:00',
        description: '주간 운동',
        location: '체육관',
        category: '건강',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 30,
      },
      {
        id: 'repeat-2',
        title: '매주 운동',
        date: '2024-01-08',
        startTime: '07:00',
        endTime: '08:00',
        description: '주간 운동',
        location: '체육관',
        category: '건강',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 30,
      },
      {
        id: 'repeat-3',
        title: '매주 운동',
        date: '2024-01-15',
        startTime: '07:00',
        endTime: '08:00',
        description: '주간 운동',
        location: '체육관',
        category: '건강',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 30,
      },
    ];

    const updates = {
      title: '특별 운동 세션',
      startTime: '08:00',
      endTime: '09:30',
      description: '개별 수정된 운동',
    };

    // When: updateSingleRepeatEvent 함수로 해당 이벤트 수정
    const updatedEvents = updateSingleRepeatEvent(existingEvents, 'repeat-2', updates);

    // Then: 해당 이벤트의 repeat.type이 'none'으로 변경되고 내용이 업데이트됨
    const updatedEvent = updatedEvents.find((event) => event.id === 'repeat-2');
    expect(updatedEvent).toBeDefined();
    expect(updatedEvent!.repeat.type).toBe('none');
    expect(updatedEvent!.title).toBe('특별 운동 세션');
    expect(updatedEvent!.startTime).toBe('08:00');
    expect(updatedEvent!.endTime).toBe('09:30');
    expect(updatedEvent!.description).toBe('개별 수정된 운동');

    // 다른 이벤트들은 변경되지 않아야 함
    const otherEvents = updatedEvents.filter((event) => event.id !== 'repeat-2');
    otherEvents.forEach((event) => {
      expect(event.repeat.type).toBe('weekly');
      expect(event.title).toBe('매주 운동');
    });
  });

  test('반복 일정 중 하나를 삭제하면 해당 이벤트만 삭제된다', () => {
    // Given: 반복으로 생성된 여러 이벤트가 저장된 상태
    const existingEvents: Event[] = [
      {
        id: 'daily-1',
        title: '매일 독서',
        date: '2024-01-01',
        startTime: '20:00',
        endTime: '21:00',
        description: '일일 독서 시간',
        location: '집',
        category: '자기계발',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 15,
      },
      {
        id: 'daily-2',
        title: '매일 독서',
        date: '2024-01-02',
        startTime: '20:00',
        endTime: '21:00',
        description: '일일 독서 시간',
        location: '집',
        category: '자기계발',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 15,
      },
      {
        id: 'daily-3',
        title: '매일 독서',
        date: '2024-01-03',
        startTime: '20:00',
        endTime: '21:00',
        description: '일일 독서 시간',
        location: '집',
        category: '자기계발',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 15,
      },
    ];

    // When: deleteSingleRepeatEvent 함수로 특정 이벤트 삭제
    const remainingEvents = deleteSingleRepeatEvent(existingEvents, 'daily-2');

    // Then: 해당 이벤트만 삭제되고 나머지 반복 이벤트들은 유지됨
    expect(remainingEvents).toHaveLength(2);
    expect(remainingEvents.find((event) => event.id === 'daily-2')).toBeUndefined();
    expect(remainingEvents.find((event) => event.id === 'daily-1')).toBeDefined();
    expect(remainingEvents.find((event) => event.id === 'daily-3')).toBeDefined();

    // 남은 이벤트들은 여전히 반복 설정을 유지해야 함
    remainingEvents.forEach((event) => {
      expect(event.repeat.type).toBe('daily');
    });
  });
});

describe('반복 일정 시각적 구분 처리', () => {
  test('반복 이벤트는 시각적 구분을 위한 플래그를 가진다', () => {
    // Given: 반복 설정으로 생성된 이벤트들
    const events: Event[] = [
      {
        id: 'repeat-1',
        title: '반복 일정',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 0,
      },
      {
        id: 'single-1',
        title: '단일 일정',
        date: '2024-01-02',
        startTime: '14:00',
        endTime: '15:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 0,
      },
    ];

    // When: 이벤트 목록을 확인할 때
    const markedEvents = markRepeatEvents(events);

    // Then: 각 반복 이벤트는 isRepeatEvent 플래그가 true로 설정됨
    const repeatEvent = markedEvents.find((event) => event.id === 'repeat-1');
    const singleEvent = markedEvents.find((event) => event.id === 'single-1');

    expect(repeatEvent).toHaveProperty('isRepeatEvent', true);
    expect(singleEvent).toHaveProperty('isRepeatEvent', false);
  });

  test('단일 수정된 반복 이벤트는 반복 표시가 제거된다', () => {
    // Given: 반복으로 생성된 이벤트 중 하나가 수정된 상태
    const events: Event[] = [
      {
        id: 'modified-repeat',
        title: '수정된 일정',
        date: '2024-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '단일 수정됨',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 1 }, // 단일 수정으로 인해 'none'으로 변경됨
        notificationTime: 0,
      },
    ];

    // When: 해당 이벤트의 상태를 확인할 때
    const markedEvents = markRepeatEvents(events);

    // Then: isRepeatEvent 플래그가 false로 변경됨
    const modifiedEvent = markedEvents.find((event) => event.id === 'modified-repeat');
    expect(modifiedEvent).toHaveProperty('isRepeatEvent', false);
  });
});

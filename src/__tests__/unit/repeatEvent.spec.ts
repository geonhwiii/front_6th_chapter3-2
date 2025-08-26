import { describe, test, expect } from 'vitest';

import { Event } from '../../types';
import { generateRepeatDates } from '../../utils/dateUtils';

describe('31일 기준 매월 반복 처리', () => {
  test('31일이 없는 달은 제외된다', () => {
    // Given: 31일 기준 매월 반복 설정이 주어졌을 때
    const baseEvent: Event = {
      id: 'test-1',
      title: '31일 반복 일정',
      date: '2024-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-07-31',
      },
      notificationTime: 0,
    };

    // When: 다음 6개월의 반복 날짜를 계산할 때
    const endDate = new Date('2024-07-31');
    const repeatDates = generateRepeatDates(baseEvent, endDate);

    // Then: 31일이 없는 달(2월, 4월, 6월, 9월, 11월)은 제외되어야 한다
    const expectedDates = [
      '2024-01-31', // 원본
      '2024-03-31', // 3월 31일 (2월 건너뜀)
      '2024-05-31', // 5월 31일 (4월 건너뜀)
      '2024-07-31', // 7월 31일 (6월 건너뜀)
    ];

    expect(repeatDates).toEqual(expectedDates);
  });
});

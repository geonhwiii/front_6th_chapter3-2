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

describe('윤년 2월 29일 매년 반복 처리', () => {
  test('평년에는 해당 날짜가 생성되지 않는다', () => {
    // Given: 윤년 2024년 2월 29일 기준 매년 반복 설정이 주어졌을 때
    const baseEvent: Event = {
      id: 'test-2',
      title: '윤년 반복 일정',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2028-12-31',
      },
      notificationTime: 0,
    };

    // When: 다음 4년의 반복 날짜를 계산할 때
    const endDate = new Date('2028-12-31');
    const repeatDates = generateRepeatDates(baseEvent, endDate);

    // Then: 평년(2025, 2026, 2027)에는 해당 날짜가 생성되지 않아야 한다
    // 2028년은 윤년이므로 2월 29일이 생성되어야 함
    const expectedDates = [
      '2024-02-29', // 원본 (2024년은 윤년)
      '2028-02-29', // 2028년은 윤년이므로 생성됨
      // 2025, 2026, 2027년은 평년이므로 2월 29일이 없어서 제외됨
    ];

    expect(repeatDates).toEqual(expectedDates);
  });
});

describe('반복 종료 조건 처리', () => {
  test('특정 날짜까지 종료 조건이 적용된다', () => {
    // Given: 반복 일정과 "특정 날짜까지" 종료 조건이 주어졌을 때
    const baseEvent: Event = {
      id: 'test-3',
      title: '종료 날짜 테스트',
      date: '2024-01-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-03-15', // 3월 15일까지만
      },
      notificationTime: 0,
    };

    // When: 반복 일정을 생성할 때
    const endDate = new Date('2024-12-31'); // 더 큰 범위로 설정
    const repeatDates = generateRepeatDates(baseEvent, endDate);

    // Then: 지정한 종료 날짜를 넘지 않는 일정들만 반환되어야 한다
    const expectedDates = [
      '2024-01-01', // 원본
      '2024-02-01', // 2월 1일
      '2024-03-01', // 3월 1일 (3월 15일 이전이므로 포함)
      // '2024-04-01'은 endDate(3월 15일) 이후이므로 제외됨
    ];

    expect(repeatDates).toEqual(expectedDates);
  });
});

describe('반복 간격 계산', () => {
  test('매일 반복에 2일 간격이 적용된다', () => {
    // Given: 매일 반복에 2일 간격 설정이 주어졌을 때
    const baseEvent: Event = {
      id: 'test-4',
      title: '간격 테스트',
      date: '2024-01-01',
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'daily',
        interval: 2, // 2일 간격
        endDate: '2024-01-20',
      },
      notificationTime: 0,
    };

    // When: 10개의 반복 일정을 생성할 때
    const endDate = new Date('2024-01-20');
    const repeatDates = generateRepeatDates(baseEvent, endDate);

    // Then: 2일씩 간격을 두고 일정이 생성되어야 한다
    const expectedDates = [
      '2024-01-01', // 원본 (1월 1일)
      '2024-01-03', // +2일 (1월 3일)
      '2024-01-05', // +2일 (1월 5일)
      '2024-01-07', // +2일 (1월 7일)
      '2024-01-09', // +2일 (1월 9일)
      '2024-01-11', // +2일 (1월 11일)
      '2024-01-13', // +2일 (1월 13일)
      '2024-01-15', // +2일 (1월 15일)
      '2024-01-17', // +2일 (1월 17일)
      '2024-01-19', // +2일 (1월 19일)
    ];

    expect(repeatDates).toEqual(expectedDates);
  });
});

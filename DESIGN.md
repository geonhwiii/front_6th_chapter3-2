# 캘린더 반복 일정 기능 TDD 설계문서

## 프로젝트 개요

### 현재 상태 분석

- React + TypeScript + Vite 기반 캘린더 애플리케이션
- 테스트 도구: Vitest + Testing Library
- 기존 기능: 일정 생성/수정/삭제, 캘린더 뷰, 검색, 알림
- **반복 일정 상태**: UI와 상태관리는 구현되어 있으나 핵심 비즈니스 로직은 미구현
  - `useEventForm.ts`: 반복 설정 상태 관리 완료
  - `App.tsx`: 반복 설정 UI 완료
  - **미구현**: 실제 반복 일정 생성/처리 로직

### 기존 타입 구조 (이미 정의됨)

```typescript
export interface RepeatInfo {
  type: RepeatType; // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number;
  endDate?: string;
}

export interface Event extends EventForm {
  id: string;
  repeat: RepeatInfo;
}
```

### 기존 파일 구조 활용

- `src/utils/dateUtils.ts`: 기존 날짜 유틸리티에 반복 로직 추가
- `src/hooks/useEventForm.ts`: 이미 반복 설정 상태 관리 구현됨
- `src/hooks/useEventOperations.ts`: 일정 CRUD 작업 처리

## PR 템플릿 기반 구현 요구사항

### 필수 구현 사항
1. **31일 매월 반복**: 31일이 없는 달은 제외
2. **윤년 29일 매년 반복**: 평년에는 제외  
3. **반복 일정 시각적 구분 표시**
4. **반복 종료 조건**: 특정 날짜까지, 특정 횟수만큼
5. **반복 일정 단일 수정**: 단일 일정으로 변경
6. **반복 일정 단일 삭제**: 해당 일정만 삭제

### 선택 구현 사항  
- 반복 간격 설정, 예외 날짜 처리, 요일 지정 반복 등

## TDD 구현 계획

### 1단계: Unit Tests - 핵심 비즈니스 로직

#### 1.1 `dateUtils.ts`에 반복 날짜 계산 함수 추가

**테스트 파일**: `src/__tests__/unit/repeatEvent.spec.ts`

##### Given-When-Then 구조:

```javascript
// 31일 매월 반복 테스트 (PR 템플릿 필수 요구사항)
describe('generateRepeatDates - 31일 기준 매월 반복 처리', () => {
  test('31일이 없는 달은 제외된다', () => {
    // Given: 31일 기준 매월 반복 설정이 있는 이벤트
    // When: generateRepeatDates 함수로 반복 날짜를 계산할 때
    // Then: 31일이 없는 달(2월, 4월, 6월, 9월, 11월)은 제외되어야 한다
  });
});

// 윤년 처리 테스트 (PR 템플릿 필수 요구사항)
describe('generateRepeatDates - 윤년 2월 29일 매년 반복 처리', () => {
  test('평년에는 해당 날짜가 생성되지 않는다', () => {
    // Given: 윤년 2024년 2월 29일 기준 매년 반복 설정이 있는 이벤트
    // When: generateRepeatDates 함수로 향후 3년간 반복 날짜를 계산할 때
    // Then: 평년(2025, 2026, 2027)에는 해당 날짜가 생성되지 않아야 한다
  });
});
```

**새로 추가할 함수들**:

- `generateRepeatDates(event: Event, endDate: Date): string[]`
- `isValidRepeatDate(date: Date, originalDate: Date, repeatType: RepeatType): boolean`

#### 1.2 반복 종료 조건 처리

##### Given-When-Then 구조:

```javascript
describe('반복 종료 조건 처리', () => {
  test('특정 날짜까지 종료 조건이 적용된다', () => {
    // Given: 반복 일정과 "특정 날짜까지" 종료 조건
    // When: 반복 일정을 생성
    // Then: 지정한 종료 날짜를 넘지 않는 일정들만 반환
  });

  test('특정 횟수만큼 종료 조건이 적용된다', () => {
    // Given: 반복 일정과 "특정 횟수만큼" 종료 조건
    // When: 반복 일정을 생성
    // Then: 지정한 횟수만큼의 일정들만 반환
  });
});
```

### 2단계: Integration Tests - 전체 기능 플로우

#### 2.1 반복 일정 생성부터 표시까지

**테스트 파일**: `src/__tests__/integration/repeatEventFlow.spec.ts`

##### Given-When-Then 구조:

```javascript
describe('반복 일정 생성 플로우', () => {
  test('반복 유형 선택 후 캘린더에 구분되어 표시된다', () => {
    // Given: 일정 생성 폼이 렌더링
    // When: 반복 유형을 선택하고 일정을 생성
    // Then: 캘린더에 반복 일정이 시각적으로 구분되어 표시
  });
});

describe('반복 일정 단일 수정/삭제 플로우', () => {
  test('특정 날짜 반복 일정 수정시 단일 일정으로 변경된다', () => {
    // Given: 캘린더에 반복 일정이 표시
    // When: 특정 날짜의 반복 일정을 수정
    // Then: 해당 일정은 단일 일정으로 변경되고 반복 표시가 사라짐
  });

  test('특정 날짜 반복 일정 삭제시 해당 날짜만 삭제된다', () => {
    // Given: 캘린더에 반복 일정이 표시
    // When: 특정 날짜의 반복 일정을 삭제
    // Then: 해당 날짜 일정만 삭제되고 다른 반복 일정은 유지
  });
});

describe('반복 일정 전체 수정/삭제 플로우', () => {
  test('반복 일정 전체 수정/삭제시 모든 관련 일정이 함께 처리된다', () => {
    // Given: 반복 일정이 여러 개 생성
    // When: 반복 일정 전체를 수정/삭제
    // Then: 모든 관련 반복 일정이 함께 수정/삭제
  });
});
```

### 3단계: Hooks Tests - 상태 관리

#### 3.1 반복 일정 관리 훅

**테스트 파일**: `src/__tests__/hooks/useRepeatEvent.spec.ts`

##### Given-When-Then 구조:

```javascript
describe('useRepeatEvent 훅', () => {
  test('반복 일정 생성 시 모든 반복 인스턴스가 생성된다', () => {
    // Given: 반복 설정이 있는 일정 데이터
    // When: createRepeatEvent 함수 호출
    // Then: 설정에 따른 모든 반복 일정이 생성됨
  });

  test('단일 반복 일정 수정 시 해당 인스턴스만 수정된다', () => {
    // Given: 생성된 반복 일정들
    // When: 특정 인스턴스를 수정
    // Then: 해당 인스턴스만 수정되고 나머지는 유지
  });
});
```

## TDD 구현 순서

### Phase 1: 테스트 작성 및 Red 상태 확인

1. Given-When-Then 주석으로 테스트 시나리오 정리
2. 실패하는 테스트 코드 작성
3. `npm test` 실행하여 Red 상태 확인

### Phase 2: 최소 구현으로 Green 상태 달성

1. 테스트를 통과하는 최소한의 구현
2. 기능적 완성보다는 테스트 통과에 집중

### Phase 3: Refactor 단계

1. 코드 품질 개선
2. 중복 제거 및 최적화
3. 추가 테스트 케이스 보강

## 구현 대상 파일 구조

```
src/
├── utils/
│   └── repeatUtils.ts          # 반복 일정 계산 로직
├── hooks/
│   └── useRepeatEvent.ts       # 반복 일정 상태 관리
├── types.ts                    # RepeatInfo 타입 확장
└── __tests__/
    ├── unit/
    │   └── repeatEvent.spec.ts          # 비즈니스 로직 테스트
    ├── integration/
    │   └── repeatEventFlow.spec.ts      # 전체 플로우 테스트
    └── hooks/
        └── useRepeatEvent.spec.ts       # 훅 테스트
```

## TDD 준수 원칙

1. **절대 구현 코드 먼저 작성 금지**
2. **Given-When-Then 주석 먼저 작성**
3. **Red → Green → Refactor 사이클 준수**
4. **한 번에 하나의 테스트만 통과시키기**
5. **테스트가 실패하는 것을 확인한 후 구현 시작**

## 선택 기능 (추후 구현)

### 요일 지정 반복

```javascript
// Given: 주간 반복에 특정 요일(월, 수, 금) 설정
// When: 4주간의 반복 일정을 계산
// Then: 지정된 요일에만 일정이 생성
```

### 월간 반복 옵션

```javascript
// Given: "매월 둘째 주 화요일" 설정
// When: 6개월간의 반복 일정을 계산
// Then: 각 달의 둘째 주 화요일에만 일정이 생성
```

### 예외 날짜 처리

```javascript
// Given: 반복 일정과 예외 날짜 목록
// When: 반복 일정을 생성
// Then: 예외 날짜는 제외된 일정 목록이 반환
```

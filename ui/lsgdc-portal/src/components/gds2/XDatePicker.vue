<template>
  <div class="flex flex-col w-fit">
    <div class="flex items-center justify-between">
      <button
        class="btn btn-borderless btn-square text-ui-700"
        @click="showing === 'day' ? changeMonths(-1) : changeMonths(-12)"
      >
        <span
          class="material-symbols-outlined"
        >chevron_left</span>
      </button>
      <button
        class="btn btn-borderless text-ui-900"
        @click="showing = showing === 'month' ? 'day' : 'month'"
      >
        {{
          showing === "day" ? `${viewMonthText} ${viewYearText}` : viewYearText
        }}
      </button>
      <button
        class="btn btn-borderless btn-square text-ui-700"
        @click="showing === 'day' ? changeMonths(1) : changeMonths(12)"
      >
        <span
          class="material-symbols-outlined"
        >chevron_right</span>
      </button>
    </div>
    <div
      v-if="showing === 'day'"
      class="grid grid-cols-[repeat(7,_2.25rem)] auto-rows-[2.25rem] justify-items-center items-center"
    >
      <span class="text-sm text-ui-700 select-none">Mo</span>
      <span class="text-sm text-ui-700 select-none">Tu</span>
      <span class="text-sm text-ui-700 select-none">We</span>
      <span class="text-sm text-ui-700 select-none">Th</span>
      <span class="text-sm text-ui-700 select-none">Fr</span>
      <span class="text-sm text-ui-700 select-none">Sa</span>
      <span class="text-sm text-ui-700 select-none">Su</span>
      <span
        v-for="day in viewWeekdayStart" :key="day"
        class="text-ui-700 opacity-50 select-none"
      >{{ daysInPreviousViewMonth - viewWeekdayStart + day }}</span>
      <button
        v-for="day in daysInViewMonth" :key="day"
        class="flex justify-center items-center h-full w-full leading-none rounded-lg select-none hover:cursor-pointer"
        :class="simplifiedDate.toString() === selectedDate(day).toString() ? 'bg-primary-500 text-white hover:bg-primary-400 hover:text-white' : 'text-ui-800 hover:bg-ui-200 hover:text-ui-900'"
        @click="selectDate(day)"
      >
        {{ day }}
      </button>
      <span
        v-for="day in (6 - viewWeekdayEnd)" :key="day"
        class="text-ui-700 opacity-50 select-none"
      >{{ day }}</span>
    </div>
    <div
      v-else-if="showing === 'month'"
      class="grid grid-cols-[repeat(3,_5.25rem)] grid-rows-[repeat(4,_2.25rem)] justify-items-center items-center"
    >
      <button
        v-for="(month, i) in months" :key="month"
        class="btn btn-borderless text-ui-800 w-full h-full"
        :class="simplifiedMonth.toString() === selectedMonth(i).toString() ? 'bg-primary-500 text-white hover:bg-primary-400 hover:text-white' : ''"
        @click="selectMonth(i - viewDate.getMonth())"
      >
        {{ month }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: Date | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const date = computed({
  get() {
    return props.modelValue || new Date();
  },
  set(value: Date) {
    emit('update:modelValue', value);
  }
});

const viewDate = ref(new Date(date.value.getFullYear(), date.value.getMonth()));

const viewMonth = computed(() => {
  return viewDate.value.getMonth();
});
const viewYear = computed(() => {
  return viewDate.value.getFullYear();
});

const viewMonthText = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, { month: 'long' }).format(viewDate.value);
});
const viewYearText = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, { year: 'numeric' }).format(viewDate.value);
});
const daysInViewMonth = computed(() => {
  return new Date(Number(viewYear.value), viewDate.value.getMonth() + 1, 0).getDate();
});
const daysInPreviousViewMonth = computed(() => {
  return new Date(Number(viewYear.value), viewDate.value.getMonth(), 0).getDate();
});
const viewWeekdayStart = computed(() => {
  const firstOfTheMonth = new Date(Number(viewYear.value), viewDate.value.getMonth(), 1);
  return firstOfTheMonth.getDay() - 1 === -1 ? 6 : firstOfTheMonth.getDay() - 1;
});
const viewWeekdayEnd = computed(() => {
  const lastOfTheMonth = new Date(Number(viewYear.value), viewDate.value.getMonth() + 1, 0);
  return lastOfTheMonth.getDay() - 1 === -1 ? 6 : lastOfTheMonth.getDay() - 1;
});

function changeMonths(months: number | string) {
  const d = ref(viewDate.value.getDate());
  viewDate.value.setMonth(viewDate.value.getMonth() + +months);
  if (viewDate.value.getDate() != d.value) {
    viewDate.value.setDate(0);
  }
  viewDate.value = new Date(viewDate.value);
}

const simplifiedDate = computed(() => {
  return new Date(date.value.getFullYear(), date.value.getMonth(), date.value.getDate());
});
const simplifiedMonth = computed(() => {
  return new Date(date.value.getFullYear(), date.value.getMonth());
});

const selectedDate = (day: number) => {
  return new Date(viewYear.value, viewMonth.value, day);
};
const selectedMonth = (month: number) => {
  return new Date(viewYear.value, month);
};

const selectDate = (day: number) => {
  date.value = selectedDate(day);
};
const selectMonth = (months: number) => {
  changeMonths(months);
  showing.value = 'day';
};

watch(date, () => {
  viewDate.value = new Date(date.value.getFullYear(), date.value.getMonth());
});

const showing = ref('day');

const months = ref(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
</script>

<template>
  <div :class="['message', type]">
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  },
  text: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.message {
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  border: 1px solid transparent;
}

.success {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-color: #bee5eb;
}

.warning {
  background-color: #fff3cd;
  color: #856404;
  border-color: #ffeeba;
}
</style>
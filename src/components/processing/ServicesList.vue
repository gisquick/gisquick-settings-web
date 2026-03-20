<template>
  <div class="processing-services-list f-col">
    <div class="panel-header f-row-ac px-2">
      <span class="f-grow">Services</span>
      <v-btn class="icon small" title="Add service" @click="$emit('add')">
        <v-icon name="plus"/>
      </v-btn>
    </div>
    <div class="list f-col">
      <div v-if="!services.length" class="empty-hint px-2 py-3">
        No services configured
      </div>
      <div
        v-for="(svc, i) in services"
        :key="i"
        class="service-item f-row-ac px-2"
        :class="{ active: selectedIndex === i && !isNew }"
        @click="$emit('select', i)"
      >
        <span class="f-grow item-label" v-text="svc.name || svc.url || '(unnamed)'"/>
        <v-btn class="icon small" @click.stop="$emit('delete', i)">
          <v-icon name="delete_forever" size="16"/>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProcessingServicesList',
  props: {
    services: {
      type: Array,
      default: () => []
    },
    selectedIndex: {
      type: Number,
      default: null
    },
    isNew: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.processing-services-list {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #ddd;
  background-color: #f5f5f5;
}

.panel-header {
  height: 38px;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
  background-color: #eee;
  flex-shrink: 0;
}

.list {
  flex: 1 1 0;
}

.service-item {
  height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #e8e8e8;
  font-size: 13.5px;
  &:hover {
    background-color: #e8e8e8;
  }
  &.active {
    background-color: var(--color-primary);
    color: #fff;
    --fill-color: #fff;
  }
}

.item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  font-size: 13px;
  color: #999;
  font-style: italic;
}
</style>

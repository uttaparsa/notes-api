<template>
  <div class="card mb-3 widget-content shadow">
    <div class="widget-content-outer">
      <div class="widget-content-wrapper">
        <div class="widget-content-right">
          <div class="widget-heading">{{header}}</div>
          <div class="widget-subheading">{{ description }}</div>
        </div>
        <div class="widget-content-left">
          <div class="widget-numbers text-right " :class="bg_color_class">{{title}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["header", "description", "title", "bg_color_class"],
};
</script>

<style lang="scss">
.widget-content {
    padding: 1rem;
    flex-direction: row;
    align-items: center;
}
.widget-content .widget-content-wrapper {
    display: flex;
    flex: 1;
    position: relative;
    align-items: center;
}
.widget-content .widget-content-right .widget-heading {
    opacity: 0.9;
    font-weight: bold;
    font-size: 1.1em;
}
.widget-content .widget-content-left .widget-subheading {
    opacity: 0.5;
}
.widget-content .widget-content-right {
    margin-left: auto;
}
.widget-content .widget-numbers {
    font-weight: bold;
    font-size: 1.8rem;
    display: block;
}
.widget-content .widget-content-outer {
    display: flex;
    flex: 1;
    flex-direction: column;
}
.widget-content .widget-progress-wrapper {
    margin-top: 1rem;
}
.widget-content .widget-progress-wrapper .progress-sub-label {
    margin-top: 0.33333rem;
    opacity: 0.5;
    display: flex;
    align-content: center;
    align-items: center;
}
.widget-content .widget-progress-wrapper .progress-sub-label .sub-label-right {
    margin-left: auto;
}
.widget-content .widget-content-right.widget-content-actions {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s;
}
.widget-content:hover .widget-content-right.widget-content-actions {
    visibility: visible;
    opacity: 1;
}
</style>>

<template>
  <div>
    <div style="min-width: 250px;" class="q-mr-sm">
      <q-select
        filled
        v-model="selectedAccounts"
        multiple
        :options="accounts"
        use-chips
        stack-label
        label="Accounts"
      />
    </div>
    <div style="min-width: 250px;" class="q-mr-sm">
      <q-select
        filled
        v-model="selectedAssets"
        multiple
        :options="assets"
        use-chips
        stack-label
        label="Assets"
      />
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style></style>

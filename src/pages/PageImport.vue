<template>
  <q-page class="constrain q-pa-md" id="pageImport">
    <q-form class="q-gutter-md q-pa-lg">
      <p>
        Please see the <router-link to="help">help</router-link> page for
        information on bitcoin.tax file formats.
      </p>
      <q-file
        v-model="files"
        label="Select/Drop csv files bitcoin.tax format"
        filled
        multiple
      />
    </q-form>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { processFile } from "../services/file-handler";
const reader = new FileReader();
let currentFileName = null;
reader.onload = async function(event) {
  const result = await processFile(
    currentFileName,
    atob(event.target.result.split("base64,")[1])
  );
  currentFileName = null;
  //console.log(atob(event.target.result.split("base64,")[1]));
};
export default {
  name: "PageImport",
  data() {
    return {
      files: null,

      messages: [],
      $store: store,
      $actions: actions
    };
  },
  watch: {
    files: function(val) {
      for (const f of val) {
        const interval = setInterval(() => {
          if (currentFileName != null) return;
          clearInterval(interval);
          currentFileName = f.name;
          reader.readAsDataURL(f);
        }, 400);
      }
    }
  },

  mounted() {
    window.__vue_mounted = "PageImport";
  }
};
</script>

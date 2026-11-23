import { createApp } from './app.js';

const PORT = Number(process.env.PORT || 4000);
const { app } = createApp();

app.listen(PORT, () => {
  console.log(`MedSlot server running at http://localhost:${PORT}`);
});

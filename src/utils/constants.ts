export const FPS = 1;
export const TOTAL_FRAMES = 150;
export const TIME_STEP = 1000 / 5;
export const FRAME_DURATION = TIME_STEP / FPS;
export const MANUAL_FORWARD_BACKWARD_STEP_SIZE = 10;

// Baseline Test:
// 1fps, GOP=1, CRF=18 (already tested)
// ffmpeg -i composited_12fps_g15_crf18.mp4 -vf "fps=1" -c:v libx264 -preset fast -crf 18 -g 1 -c:a copy composited_1fps_g1_crf18.mp4

// Experiment with a higher GOP for compression:
// 1fps, GOP=24, CRF=18
// ffmpeg -i composited_12fps_g15_crf18.mp4 -vf "fps=1" -c:v libx264 -preset fast -crf 18 -g 24 -c:a copy composited_1fps_g24_crf18.mp4

// Experiment with a higher CRF for smaller file sizes:
// 1fps, GOP=1, CRF=22
// ffmpeg -i composited_12fps_g15_crf18.mp4 -vf "fps=1" -c:v libx264 -preset fast -crf 22 -g 1 -c:a copy composited_1fps_g1_crf22.mp4

// Experiment with a middle-range CRF and GOP:
// 2fps, GOP=24, CRF=20 (to see if a balance between size and quality affects mobile performance)
// ffmpeg -i composited_12fps_g15_crf18.mp4 -vf "fps=2" -c:v libx264 -preset fast -crf 20 -g 24 -c:a copy composited_2fps_g24_crf20.mp4

// Experiment with 2fps, GOP=1, CRF=20
// https://66ec25f4be66f5a97c902a33--tourmaline-strudel-6f79a4.netlify.app/
// ffmpeg -i composited_12fps_g15_crf18.mp4 -vf "fps=2" -c:v libx264 -preset fast -crf 20 -g 1 -c:a copy composited_2fps_g1_crf20_latest.mp4

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{target:'es2022',outDir:'dist-local/web',sourcemap:false,emptyOutDir:true}});

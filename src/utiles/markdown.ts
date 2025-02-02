
// @ts-expect-error  This is a temporary workaround for a known issue.
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js'; // 引入 highlight.js

// @ts-expect-error  This is a temporary workaround for a known issue.
import { full as emoji } from 'markdown-it-emoji'

import path from 'path';
import fs from "fs"

export const md2html = (mdContent: string, filePath: string) => {
  const md = new MarkdownIt({
    highlight: (code: string, language: string) => {
      if (language && hljs.getLanguage(language)) {
        try {
          // 使用 highlight.js 高亮代码
          return `<pre class="hljs"><code class="language-${language}">${hljs.highlight(code, { language }).value}</code></pre>`;
        } catch (err) {
          window.console.error(`highlight: ${err}`)
        }
      }
      // 如果没有指定语言或语言不支持，默认处理
      return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
    },
    // @ts-expect-error no type
  }).use(emoji).use((mdInstance) => imgPlug(mdInstance, filePath))

  return md.render(mdContent);
};

const imgPlug = (mdInstance: object, filePath: string) => {
  // @ts-expect-error no type
  const defaultRender = mdInstance.renderer.rules.image || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  // @ts-expect-error no type
  mdInstance.renderer.rules.image = function (tokens, idx, options, env, self) {
    // 获取原始 token 和 src
    const token = tokens[idx];
    const srcIndex = token.attrIndex('src');

    if (srcIndex >= 0) {
      // 自定义修改路径
      const originalSrc = token.attrs[srcIndex][1];
      // nextjs public/ 下的资源在构建后会上移一级到跟根目录，所以 public/ 前缀要一并移除；
      const resourcesRelativePath = path.relative(path.join(process.cwd(), 'public/'), filePath);
      const folderPath = path.dirname(resourcesRelativePath);
      const src = path.join("/", folderPath, originalSrc);
      token.attrs[srcIndex][1] = src
    }

    // 调用默认渲染器
    return defaultRender(tokens, idx, options, env, self);
  };
}

export const getMdFileFullPathByUri = (uri: string, dirPath: string) => {
  const filePath = path.join(dirPath, uri);
  const filePathFix = `${filePath}.md`
  if (fs.existsSync(filePathFix)) { // uri 完全匹配文件
    return filePathFix
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    // uri 直接对应的path是文件夹，尝试作为indexpage
    const potentialFiles = [
      path.join(filePath, 'index.md'),
      path.join(filePath, 'readme.md'),
      path.join(filePath, "README.md")
    ]
    for (const potentialFile of potentialFiles) {
      if (fs.existsSync(potentialFile)) {
        return potentialFile
      }
    }
  }
  return null
}
export const getMdFileContentByPath = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return fileContent
  }
  return ''
}

export const getAllMdFile = (dirPath: string, fileArray: string[] = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllMdFile(filePath, fileArray); // 递归查找
    } else if (file.endsWith(".md")) {
      fileArray.push(filePath);
    }
  });

  return fileArray;
}
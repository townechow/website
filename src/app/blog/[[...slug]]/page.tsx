import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import "./index.css";
import { md2html, getMdFileContentByPath, getMdFileFullPathByUri } from "@/utiles";

const POST_Dir = path.join(process.cwd(), "public/blog");
const MdFileRootFold = "public/blog"
export async function generateStaticParams() {
  const postsDir = path.join(POST_Dir);

  // 递归获取所有 Markdown 文件路径
  function getAllFiles(dirPath: string, fileArray: string[] = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileArray); // 递归查找
      } else if (file.endsWith(".md")) {
        fileArray.push(filePath);
      }
    });

    return fileArray;
  }

  const allFiles = getAllFiles(postsDir);
  // console.log("allFiles", allFiles);

  // 转换文件路径为路由参数
  const paths = allFiles.map((filePath) => {
    const relativePath = path.relative(postsDir, filePath);
    const slug = relativePath.replace(/\.md$/, "").split(path.sep); // 转换成数组

    return { slug };
  });

  return paths;
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {

  // slug: [], [/], [/post1]
  const { slug } = await params;

  // filePath, foldPath 

  const uri = path.join(...(slug?.map(p => decodeURIComponent(p))) || ["/"]);
  const filePath = getMdFileFullPathByUri(uri, MdFileRootFold)

  console.log("filePath", filePath)
  if (!filePath) {
    return notFound()
  }
  // 读取 Markdown 文件内容
  const fileContent = getMdFileContentByPath(filePath);
  const { content, data } = matter(fileContent); // 解析内容和元数据
  const contentHtml = md2html(content, filePath);

  return (
    <div className="markdown-body">
      <h1>{data.title}</h1>
      <article
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}

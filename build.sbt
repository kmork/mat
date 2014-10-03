name := "mat"

version := "1.0-SNAPSHOT"

scalaVersion := "2.10.4"

libraryDependencies ++= Seq(
  anorm,
  cache,
  "org.mongodb" %% "casbah" % "2.6.3"
)     

lazy val root = (project in file(".")).enablePlugins(PlayScala)

FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

COPY backend/lib backend/lib
COPY backend/src backend/src
COPY css css
COPY js js
COPY public public
COPY data data
COPY *.html ./

RUN mkdir -p backend/out public/uploads \
  && javac -encoding UTF-8 \
    -cp "backend/lib/gson-2.11.0.jar:backend/lib/postgresql-42.7.4.jar" \
    -d backend/out \
    backend/src/smw/*.java

ENV SMW_BIND=0.0.0.0
EXPOSE 8080
CMD ["sh", "-c", "java -cp backend/out:backend/lib/gson-2.11.0.jar:backend/lib/postgresql-42.7.4.jar smw.App /app"]
